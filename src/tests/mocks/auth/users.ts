import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'

import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { RegisterUserAction } from '@/auth/actions/register_user_action.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'
import { makeDatabase } from '@/shared/container/index.js'
import { users } from '@/database/schema/schema.js'
import type { Team, User } from '@/database/schema/database_schema_types.js'
import { makeRequestAsUser } from '@/tests/utils/http.js'
import { container } from '@/utils/typi.js'
import { Secret } from '@poppinss/utils'
import { createFakeAbTestEmailContent } from '../audiences/email_content.ts'

export async function createBroadcastForUser(
  user: User,
  audienceId: string,
  options?: {
    updateWithValidContent?: boolean
    updateWithABTestsContent?: boolean
    weights?: number[]
  },
) {
  const response = await makeRequestAsUser(user, {
    method: 'POST',
    path: '/broadcasts',
    body: {
      name: faker.lorem.words(3),
      audienceId,
    },
  })
  const { id } = await response.json()

  if (options?.updateWithValidContent) {
    await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${id}`,
      body: {
        waitingTimeToPickWinner: faker.number.int({ min: 1, max: 10 }),
        emailContent: {
          fromName: faker.lorem.words(2),
          fromEmail: faker.internet.email(),
          replyToName: faker.lorem.words(2),
          replyToEmail: faker.internet.email(),
          subject: faker.lorem.words(4),
          contentHtml: faker.lorem.paragraph(),
          contentText: faker.lorem.paragraph(),
        },
        ...(options?.updateWithABTestsContent
          ? {
              emailContentVariants: options?.weights?.map((weight) => ({
                ...createFakeAbTestEmailContent(),
                weight,
              })) ?? [
                createFakeAbTestEmailContent({ weight: 25 }),
                createFakeAbTestEmailContent({ weight: 15 }),
              ],
            }
          : {}),
      },
    })
  }

  return id
}

export const createUser = async ({
  createBroadcast,
}: {
  createMailerWithIdentity?: boolean
  createBroadcast?: boolean
} = {}) => {
  const database = makeDatabase()

  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail(),
    password: 'password',
  })

  const teamRepository = container.resolve(TeamRepository)
  const teamObject = await teamRepository.findById(team.id)

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

  let broadcastId: string | undefined = undefined

  if (createBroadcast) {
    broadcastId = await createBroadcastForUser(freshUser, audience.id, {
      updateWithValidContent: true,
    })
  }

  return {
    user: freshUser,
    team: teamObject as Team,
    audience,
    broadcastId,
  }
}
