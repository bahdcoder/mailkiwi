import { appEnv } from "@/app/env/app_env.js"
import { addDefaultChannelsCommand } from "@/cli/commands/chat/add_default_channels_comand.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"
import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { DateTime } from "luxon"
import Fs from "node:fs/promises"
import Path from "node:path"
import { fileURLToPath } from "node:url"
import { v1 } from "uuid"

import { CreateBroadcastAction } from "@/broadcasts/actions/create_broadcast_action.js"
import { UpdateBroadcastAction } from "@/broadcasts/actions/update_broadcast_action.js"

import { CreateAudienceAction } from "@/audiences/actions/audiences/create_audience_action.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"
import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { AssignSendingSourceToSendingDomainAction } from "@/sending_domains/actions/assign_sending_source_to_sending_domain_action.js"
import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.js"

import { refreshDatabase, seedAutomation } from "@/tests/mocks/teams/teams.js"

import { createDatabaseClient, createDrizzleDatabase } from "@/database/client.js"
import type { Broadcast, Team, User } from "@/database/database_schema_types.js"
import {
  broadcasts,
  contacts,
  tags,
  tagsOnContacts,
  teamMemberships,
  teams,
} from "@/database/schema.js"

import { ContainerKey, makeDatabase } from "@/shared/container/index.js"

import { createRedisDatabaseInstance } from "@/redis/redis_client.js"

import { addSecondsToDate } from "@/utils/dates.js"
import { container } from "@/utils/typi.js"

const connection = await createDatabaseClient(appEnv.DATABASE_URL)
const redis = createRedisDatabaseInstance(appEnv.REDIS_URL)

const database = createDrizzleDatabase(connection)

container.registerInstance(ContainerKey.env, appEnv)
container.registerInstance(ContainerKey.config, appEnv)
container.registerInstance(ContainerKey.database, database)
container.registerInstance(ContainerKey.redis, redis)

await refreshDatabase()

await Promise.all([
  addDefaultChannelsCommand.handler?.(),
  seedDevSendingSourcesCommand.handler?.(),
])

const registerUserAction = container.resolve(RegisterUserAction)
const createAudienceAction = container.resolve(CreateAudienceAction)

const allUsers: { user: Partial<User>; team: Partial<Team> }[] = []
for (let userIndex = 0; userIndex < 3; userIndex++) {
  console.log(`\nCreating user: ${userIndex + 1}\n`)

  const userDetails = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }),
    password: "password",
  }

  const { user } = await registerUserAction.handle(userDetails)

  await container.make(UserRepository).update(user.id, {
    emailVerifiedAt: DateTime.now().toJSDate(),
  })

  const team = await container.make(TeamRepository).create(
    {
      name: faker.company.buzzAdjective(),
    },
    user.id,
  )

  await container.make(UserRepository).update(user.id, {
    password: userDetails.password,
  })

  const audienceIds = []

  const broadcastIds = []

  for (let audienceIndex = 0; audienceIndex < 1; audienceIndex++) {
    const audiencePayload = {
      name: faker.commerce.productName(),
      slug: faker.lorem.words(3),
      product: (audienceIndex === 0 ? "letters" : "engage") as "engage" | "letters",
    }

    console.log("Creating audience: ", `${audienceIndex}: ${audiencePayload.name}`)

    const audience = await container
      .make(AudienceRepository)
      .create(audiencePayload, team.id)

    await seedAutomation({
      audienceId: audience.id,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    })

    const contactsCount = faker.helpers.rangeToNumber({
      min: 5000,
      max: 10000,
    })

    audienceIds.push({
      audienceId: audience.id,
      contactsCount,
    })

    const mockContacts = faker.helpers
      .multiple(faker.person.firstName, {
        count: contactsCount,
      })
      .map((firstName) => ({
        id: v1(),
        firstName,
        email: faker.internet
          .email({
            firstName: `${faker.person.firstName()}.${faker.number.int({ max: 50000 })}`,
            lastName: faker.person.lastName(),
          })
          .toLowerCase(),
        lastName: faker.person.lastName(),
        audienceId: audience.id,
        subscribedAt: faker.date.past(),
        avatarUrl: faker.image.avatarGitHub(),
      }))

    console.log(
      "Inserting contacts for audience:",
      `${mockContacts.length} mock contacts.`,
    )

    // create 10 fake tags
    // insert a random number of tags for each contact
    const tagsCount = faker.helpers.rangeToNumber({
      min: 5,
      max: 15,
    })

    const tagsToCreate = faker.helpers
      .multiple(faker.lorem.word, {
        count: tagsCount,
      })
      .map((name) => ({
        name,
        id: v1(),
        audienceId: audience.id,
      }))

    await database.insert(tags).values(tagsToCreate)
    await database.insert(contacts).values(mockContacts)

    const contactsWithTags = mockContacts
      .map((contact) => {
        return {
          tags: tagsToCreate
            .slice(0, faker.helpers.rangeToNumber({ min: 0, max: 5 }))
            .map((tag) => tag.id),
          id: contact.id,
        }
      })
      .map((tag) =>
        tag.tags.map((tagId) => ({
          tagId,
          contactId: tag.id,
        })),
      )
      .flat()

    await database.insert(tagsOnContacts).values(contactsWithTags)

    // create a broadcast with complete information
    const { id: broadcastId } = await container.make(CreateBroadcastAction).handle(
      {
        name: faker.commerce.productName(),
        audienceId: audience.id,
      },
      team.id,
    )

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    await container.make(UpdateBroadcastAction).handle(broadcast as Broadcast, {
      emailContent: {
        fromEmail: faker.internet.email(),
        fromName: faker.person.fullName(),
        replyToEmail: faker.internet.email(),
        replyToName: faker.person.fullName(),
        subject: faker.lorem.words(5),
        previewText: faker.lorem.words(5),
        contentHtml: await Fs.readFile(
          Path.resolve(
            Path.dirname(fileURLToPath(import.meta.url)),
            "..",
            "tests",
            "snapshots",
            "emails",
            "foundation-emails-2.html",
          ),
          "utf-8",
        ),
        contentText: faker.lorem.paragraphs(12),
      },
      segmentId: undefined,
      audienceId: undefined,
      sendAt: addSecondsToDate(new Date(), 300).toDateString(),
    })

    broadcastIds.push({
      broadcastId,
      audienceId: audience.id,
    })
  }

  console.log("\n Seeded data ✅ \n")

  const { apiKey } = await container.make(CreateTeamAccessTokenAction).handle(team.id)

  const { id: sendingDomainId } = await container
    .make(CreateSendingDomainAction)
    .handle({ name: "kb.openmailer.org" }, team.id)

  await seedDevSendingSourcesCommand?.handler?.()

  await container.make(AssignSendingSourceToSendingDomainAction).handle(sendingDomainId)

  console.dir(
    [
      [
        {
          userId: user.id,
          teamId: team.id,
          email: userDetails.email,
          password: userDetails.password,
          smtpUsername: apiKey,
          smtpPassword: apiKey,
        },
      ],
      [{ teamId: team.id }],
      audienceIds,
      broadcastIds,
    ],
    { depth: null },
  )

  allUsers.push({ user, team })
}

for (const [idx, { user }] of allUsers.entries()) {
  const otherUsers = allUsers.filter((_, uIdx) => uIdx !== idx)

  await makeDatabase()
    .insert(teamMemberships)
    .values(
      otherUsers.map((otherUser) => ({
        teamId: otherUser.team.id as string,
        userId: user.id as string,
        role: "MANAGER" as const,
        email: faker.internet.email(),
        status: "ACTIVE" as const,
        invitedAt: new Date(),
        expiresAt: new Date(),
      })),
    )

  console.log(`\nInvited user ${user?.id} to other teams ✅ `)
}

connection.destroy()
redis.disconnect()
