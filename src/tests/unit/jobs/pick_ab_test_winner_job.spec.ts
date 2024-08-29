import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test, vi } from "vitest"

import { SendAbTestBroadcastJob } from "@/broadcasts/jobs/send_ab_test_broadcast_job.ts"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts"
import {
  createBroadcastForUser,
  createUser,
} from "@/tests/mocks/auth/users.ts"
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
import { Queue } from "@/shared/queue/queue.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { hoursToSeconds } from "@/utils/dates.ts"

describe("Pick A/B Test winner", () => {
  test("picks A/B test winner for click rate winning criteria", async ({
    expect,
  }) => {
    await refreshDatabase()
    await refreshRedisDatabase()

    const database = makeDatabase()
    const redis = makeRedis()

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })

    const contactsForAudience = faker.number.int({
      min: 277,
      max: 1233,
    })

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

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: contactsForAudience,
        })
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: contactIds[idx],
          }),
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

    const jobsFromBroadcastsQueue = await Queue.broadcasts().getJobs()
    const jobsFromAbTestBroadcastQueue =
      await Queue.abTestsBroadcasts().getJobs()

    expect(jobsFromBroadcastsQueue).toHaveLength(contactsForAudience)

    const allVariants = await database
      .select()
      .from(abTestVariants)
      .where(eq(abTestVariants.broadcastId, broadcastId))

    const totalSentToVariants = jobsFromBroadcastsQueue.filter(
      (job) => !job.data.isAbTestFinalSample,
    ).length

    expect(totalSentToVariants).toBe(expectedTotalWeightsRecipients)

    const finalSampleSize =
      contactsForAudience - expectedTotalWeightsRecipients

    for (const variant of allVariants) {
      const allCallsForVariant = jobsFromBroadcastsQueue.filter(
        (job) => job.data.abTestVariantId === variant.id,
      )

      const totalForVariantWeight = Math.floor(
        (variant.weight / 100) * contactsForAudience,
      )

      expect(allCallsForVariant).toHaveLength(totalForVariantWeight)
    }

    const totalFinalSampleRecipients = jobsFromBroadcastsQueue.filter(
      (job) => job.data.isAbTestFinalSample,
    )

    expect(totalFinalSampleRecipients).toHaveLength(finalSampleSize)

    const pickWinnerJobOptions = jobsFromAbTestBroadcastQueue[0].opts

    expect(pickWinnerJobOptions.delay).toEqual(
      hoursToSeconds(broadcast?.waitingTimeToPickWinner ?? 0),
    )
  })

  test("picks A/B test winner for open rate winning criteria", async ({
    expect,
  }) => {})

  test("picks A/B test winner for open rate winning criteria", async ({
    expect,
  }) => {})
})
