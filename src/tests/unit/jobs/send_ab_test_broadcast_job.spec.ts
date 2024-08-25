import { faker } from "@faker-js/faker"
import { Job } from "bullmq"
import { eq } from "drizzle-orm"
import { describe, test, vi } from "vitest"

import { PickAbTestWinnerJob } from "@/broadcasts/jobs/pick_ab_test_winner_job.ts"
import { SendAbTestBroadcastJob } from "@/broadcasts/jobs/send_ab_test_broadcast_job.ts"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts"
import { createBroadcastForUser, createUser } from "@/tests/mocks/auth/users.ts"
import {
  refreshDatabase,
  refreshRedisDatabase,
} from "@/tests/mocks/teams/teams.ts"

import {
  abTestVariants,
  broadcasts,
  contacts,
} from "@/database/schema/schema.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import * as queues from "@/shared/queue/queue.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { hoursToSeconds } from "@/utils/dates.ts"

describe("Send broadcast job", () => {
  test("queues send email jobs for all contacts in audience for the broadcast based on a/b test variants", async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    await refreshDatabase()

    const database = makeDatabase()
    const redis = makeRedis()

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })

    const contactsForAudience = faker.number.int({ min: 277, max: 1233 })

    const testAbVariantWeights = [
      faker.number.int({ min: 14, max: 50 }),
      faker.number.int({ min: 20, max: 25 }),
    ]

    const totalWeights = testAbVariantWeights.map((weight) =>
      Math.floor((weight / 100) * contactsForAudience),
    )
    const expectedTotalWeightsRecipients = totalWeights.reduce(
      (total, weight) => total + weight,
      0,
    )

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
      updateWithABTestsContent: true,
      weights: testAbVariantWeights,
    })

    const contactIds = faker.helpers.multiple(cuid, {
      count: contactsForAudience,
    })

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: contactsForAudience })
          .map((_, idx) =>
            createFakeContact(audience.id, { id: contactIds[idx] }),
          ),
      )

    await new SendAbTestBroadcastJob().handle({
      database,
      redis,
      payload: { broadcastId },
    })

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    const broadcastsQueueJobs = await queues.Queue.broadcasts().getJobs()
    const abTestsBroadcastsQueueJobs =
      await queues.Queue.abTestsBroadcasts().getJobs()

    expect(broadcastsQueueJobs).toHaveLength(contactsForAudience)

    const allVariants = await database
      .select()
      .from(abTestVariants)
      .where(eq(abTestVariants.broadcastId, broadcastId))

    const totalSentToVariants = broadcastsQueueJobs.filter(
      (job) => !job.data.isAbTestFinalSample,
    ).length

    expect(totalSentToVariants).toBe(expectedTotalWeightsRecipients)

    const finalSampleSize = contactsForAudience - expectedTotalWeightsRecipients

    for (const variant of allVariants) {
      const allCallsForVariant = broadcastsQueueJobs.filter(
        (job) => job.data.abTestVariantId === variant.id,
      )

      const totalForVariantWeight = Math.floor(
        (variant.weight / 100) * contactsForAudience,
      )

      expect(allCallsForVariant).toHaveLength(totalForVariantWeight)
    }

    const totalFinalSampleRecipients = broadcastsQueueJobs.filter(
      (job) => job.data.isAbTestFinalSample,
    )

    expect(totalFinalSampleRecipients).toHaveLength(finalSampleSize)

    const abTestJobOptions = abTestsBroadcastsQueueJobs[0].opts

    expect(abTestJobOptions.delay).toEqual(
      hoursToSeconds(broadcast?.waitingTimeToPickWinner ?? 0),
    )
  })
})
