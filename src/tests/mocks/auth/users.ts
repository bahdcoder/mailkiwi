import { SESClient } from '@aws-sdk/client-ses'
import { SNSClient } from '@aws-sdk/client-sns'
import { faker } from '@faker-js/faker'
import { mockClient } from 'aws-sdk-client-mock'
import { eq } from 'drizzle-orm'

import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { RegisterUserAction } from '@/domains/auth/actions/register_user_action.js'
import { TeamRepository } from '@/domains/teams/repositories/team_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import { users } from '@/infrastructure/database/schema/schema.js'
import type {
  Setting,
  Team,
  User,
} from '@/infrastructure/database/schema/types.ts'
import { makeRequestAsUser } from '@/tests/utils/http.js'
import { container } from '@/utils/typi.js'

export async function createBroadcastForUser(user: User, audienceId: string) {
  const response = await makeRequestAsUser(user, {
    method: 'POST',
    path: '/broadcasts',
    body: {
      name: faker.lorem.words(3),
      audienceId,
    },
  })

  const { id } = await response.json()
  return id
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
    broadcastId = await createBroadcastForUser(freshUser, audience.id)
  }

  return {
    user: freshUser,
    team: (await teamRepository.findById(team.id)) as Team,
    audience,
    setting: setting as Setting,
    broadcastId,
  }
}
