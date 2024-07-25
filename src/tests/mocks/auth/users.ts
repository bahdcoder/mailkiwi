import { SESClient } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import { mockClient } from 'aws-sdk-client-mock'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'

import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { RegisterUserAction } from '@/domains/auth/actions/register_user_action.js'
import { TeamRepository } from '@/domains/teams/repositories/team_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import { mailers, users } from '@/infrastructure/database/schema/schema.js'
import type {
  Setting,
  Team,
  User,
} from '@/infrastructure/database/schema/types.ts'
import { makeRequestAsUser } from '@/tests/utils/http.js'
import { container } from '@/utils/typi.js'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.ts'
import { Secret } from '@poppinss/utils'
import { MailerIdentityRepository } from '@/domains/teams/repositories/mailer_identity_repository.ts'

export async function createBroadcastForUser(
  user: User,
  audienceId: string,
  options?: { updateWithValidContent?: boolean },
) {
  const response = await makeRequestAsUser(user, {
    method: 'POST',
    path: '/broadcasts',
    body: {
      name: faker.lorem.words(3),
      audienceId,
      fromName: faker.lorem.words(2),
      fromEmail: faker.internet.email(),
      replyToName: faker.lorem.words(2),
      replyToEmail: faker.internet.email(),
    },
  })
  const { id } = await response.json()

  if (options?.updateWithValidContent) {
    await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${id}`,
      body: {
        fromName: faker.lorem.words(2),
        fromEmail: faker.internet.email(),
        replyToName: faker.lorem.words(2),
        replyToEmail: faker.internet.email(),
        subject: faker.lorem.words(4),
        contentHtml: faker.lorem.paragraph(),
        contentText: faker.lorem.paragraph(),
      },
    })
  }

  return id
}

export const createMailerForTeam = async (team: Team) => {
  const database = makeDatabase()

  const { id: mailerId } = await container.make(MailerRepository).create(
    {
      name: faker.lorem.words(5),
      provider: 'AWS_SES',
      configuration: {
        accessKey: new Secret(faker.string.uuid()),
        accessSecret: new Secret(faker.string.uuid()),
        region: 'us-east-2',
        domain: 'newsletter.example.com',
        email: undefined,
      },
    },
    team,
  )

  await database
    .update(mailers)
    .set({ status: 'READY' })
    .where(eq(mailers.id, mailerId))
    .execute()

  await container.make(MailerIdentityRepository).create(
    {
      value: 'newsletter.example.com',
      type: 'DOMAIN',
    },
    mailerId,
  )
}

export const createUser = async ({
  createMailerWithIdentity,
  createBroadcast,
}: {
  createMailerWithIdentity?: boolean
  createBroadcast?: boolean
} = {}) => {
  const database = makeDatabase()

  const setting = await database.query.settings.findFirst()
  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail(),
    password: 'password',
  })

  const teamRepository = container.resolve(TeamRepository)

  const audience = await audienceRepository.createAudience(
    { name: 'Newsletter' },
    team.id,
  )

  const freshUser = (await database.query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      teams: true,
    },
  })) as User & { teams: Team[] }

  if (createMailerWithIdentity) {
    await makeRequestAsUser(freshUser, {
      method: 'POST',
      path: '/mailers',
      body: {
        name: faker.string.uuid(),
        provider: 'AWS_SES',
        configuration: {
          accessKey: faker.string.alphanumeric({ length: 16 }),
          accessSecret: faker.string.alphanumeric({ length: 16 }),
          region: 'us-east-1',
          domain: 'newsletter.example.com',
        },
      },
    })

    mockClient(SESClient).onAnyCommand().resolves({})
    mockClient(SNSClient).onAnyCommand().resolves({})
  }

  let broadcastId: string | undefined = undefined

  if (createBroadcast) {
    broadcastId = await createBroadcastForUser(freshUser, audience.id, {
      updateWithValidContent: true,
    })
  }

  return {
    user: freshUser,
    team: (await teamRepository.findById(team.id)) as Team,
    audience,
    setting: setting as Setting,
    broadcastId,
  }
}
