import { apiEnv } from "@/api/env/api_env.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"
import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import Fs from "node:fs/promises"
import Path from "node:path"
import { fileURLToPath } from "node:url"

import { CreateBroadcastAction } from "@/broadcasts/actions/create_broadcast_action.js"
import { UpdateBroadcastAction } from "@/broadcasts/actions/update_broadcast_action.js"

import { CreateAudienceAction } from "@/audiences/actions/audiences/create_audience_action.js"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"
import { RegisterUserAction } from "@/auth/actions/register_user_action.js"

import { AssignSendingSourceToSendingDomainAction } from "@/sending_domains/actions/assign_sending_source_to_sending_domain_action.js"
import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.js"

import {
  refreshDatabase,
  seedAutomation,
} from "@/tests/mocks/teams/teams.js"

import {
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/database/client.js"
import type { Broadcast } from "@/database/schema/database_schema_types.js"
import { broadcasts, contacts, teams } from "@/database/schema/schema.js"

import { ContainerKey } from "@/shared/container/index.js"

import { createRedisDatabaseInstance } from "@/redis/redis_client.js"

import { addSecondsToDate } from "@/utils/dates.js"
import { container } from "@/utils/typi.js"

const connection = await createDatabaseClient(apiEnv.DATABASE_URL)
const redis = createRedisDatabaseInstance(apiEnv.REDIS_URL)

const database = createDrizzleDatabase(connection)

container.registerInstance(ContainerKey.env, apiEnv)
container.registerInstance(ContainerKey.config, apiEnv)
container.registerInstance(ContainerKey.database, database)
container.registerInstance(ContainerKey.redis, redis)

await refreshDatabase()

const registerUserAction = container.resolve(RegisterUserAction)
const createAudienceAction = container.resolve(CreateAudienceAction)

for (let userIndex = 0; userIndex < 1; userIndex++) {
  console.log(`\nCreating user: ${userIndex + 1}\n`)

  const { team, user } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }),
    password: "password",
  })

  const audienceIds = []

  const broadcastIds = []

  for (let audienceIndex = 0; audienceIndex < 5; audienceIndex++) {
    const audiencePayload = {
      name: faker.commerce.productName(),
    }

    console.log(
      "Creating audience: ",
      `${audienceIndex}: ${audiencePayload.name}`,
    )

    const audience = await createAudienceAction.handle(
      audiencePayload,
      team.id,
    )

    await seedAutomation({
      audienceId: audience.id,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    })

    const contactsCount = faker.helpers.rangeToNumber({
      min: 50,
      max: 1000,
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

    await database.insert(contacts).values(mockContacts)

    // create a broadcast with complete information
    const { id: broadcastId } = await container
      .make(CreateBroadcastAction)
      .handle(
        {
          name: faker.commerce.productName(),
          audienceId: audience.id,
        },
        team.id,
      )

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    await container
      .make(UpdateBroadcastAction)
      .handle(broadcast as Broadcast, {
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

  const { accessKey: smtpUsername, accessSecret: teamAccessToken } =
    await container.make(CreateTeamAccessTokenAction).handle(team.id)

  const { id: sendingDomainId } = await container
    .make(CreateSendingDomainAction)
    .handle({ name: "kb.openmailer.org" }, team.id)

  await seedDevSendingSourcesCommand?.handler?.()

  await container
    .make(AssignSendingSourceToSendingDomainAction)
    .handle(sendingDomainId)

  const smtpPassword = teamAccessToken.release()

  console.dir(
    [
      [
        {
          userId: user.id,
          teamId: team.id,
          smtpUsername,
          smtpPassword,
        },
      ],
      [{ teamId: team.id }],
      audienceIds,
      broadcastIds,
    ],
    { depth: null },
  )
}

connection.destroy()
redis.disconnect()
