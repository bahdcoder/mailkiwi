import { createFakeAbTestEmailContent } from "../audiences/email_content.js"
import { faker } from "@faker-js/faker"
import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"
import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { makeRequestAsUser } from "@/tests/utils/http.js"

import type {
  Team,
  TeamMembership,
  User,
} from "@/database/schema/database_schema_types.js"
import { teams, users } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

export async function createBroadcastForUser(
  user: User,
  audienceId: number,
  options?: {
    updateWithValidContent?: boolean
    updateWithABTestsContent?: boolean
    weights?: number[]
  },
) {
  const response = await makeRequestAsUser(user, {
    method: "POST",
    path: "/broadcasts",
    body: {
      name: faker.lorem.words(3),
      audienceId,
    },
  })

  const { id } = await response.json()

  if (options?.updateWithValidContent) {
    await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${id}`,
      body: {
        waitingTimeToPickWinner: faker.number.int({
          min: 1,
          max: 10,
        }),
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
                createFakeAbTestEmailContent({
                  weight: 25,
                }),
                createFakeAbTestEmailContent({
                  weight: 15,
                }),
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
  createEntireTeam,
}: {
  createMailerWithIdentity?: boolean
  createBroadcast?: boolean
  createEntireTeam?: boolean
} = {}) => {
  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email:
      faker.number.int({ min: 0, max: 99 }) +
      faker.internet.exampleEmail(),
    password: "password",
  })

  const teamRepository = container.resolve(TeamRepository)
  const teamObject = await teamRepository.findById(team.id)

  const audience = await audienceRepository.create(
    { name: "Newsletter" },
    team.id,
  )

  const freshUser = await container.make(UserRepository).findById(user.id)

  let broadcastId: string | undefined = undefined

  if (createBroadcast) {
    broadcastId = await createBroadcastForUser(freshUser, audience.id, {
      updateWithValidContent: true,
    })
  }

  let administratorUser: User = undefined as unknown as User
  let managerUser: User = undefined as unknown as User
  let authorUser: User = undefined as unknown as User
  let guestUser: User = undefined as unknown as User

  if (createEntireTeam) {
    let [administrator, manager, author, guest] = await Promise.all([
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
      registerUserAction.handle({
        name: faker.person.fullName(),
        email: faker.internet.exampleEmail(),
        password: "password",
      }),
    ])

    const teamMembershipRepository = container.make(
      TeamMembershipRepository,
    )

    for (const [member, role] of [
      [administrator, "ADMINISTRATOR"],
      [manager, "MANAGER"],
      [author, "AUTHOR"],
      [guest, "GUEST"],
    ] as const) {
      await teamMembershipRepository.create({
        status: "ACTIVE",
        expiresAt: new Date(),
        role: role as TeamMembership["role"],
        email: "",
        userId: member?.user?.id,
        teamId: team.id,
      })
    }

    const userRepository = container.make(UserRepository)

    administratorUser = (await userRepository.findById(
      administrator.user.id,
    )) as User
    managerUser = (await userRepository.findById(manager.user.id)) as User

    authorUser = (await userRepository.findById(author.user.id)) as User

    guestUser = (await userRepository.findById(guest.user.id)) as User
  }

  return {
    user: freshUser,
    team: teamObject as Team,
    audience,
    administratorUser,
    managerUser,
    guestUser,
    authorUser,
    broadcastId,
  }
}
