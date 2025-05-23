import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { SendAbTestBroadcastJob } from '#root/core/broadcasts/jobs/send_ab_test_broadcast_job.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createBroadcastForUser, createUser } from '#root/core/tests/mocks/auth/users.js'

import { abTestVariants, broadcasts, contacts } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import * as queues from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { hoursToSeconds } from '#root/core/utils/dates.js'

describe('Send broadcast job', () => {
  test('queues send email jobs for all contacts in audience for the broadcast based on a/b test variants', async ({
    expect,
  }) => {
    const database = makeDatabase()
    const redis = makeRedis()

    const { user, audience, team, broadcastGroupId } = await createUser()

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

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
        updateWithABTestsContent: true,
        weights: testAbVariantWeights,
      },
    )

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
      logger: makeLogger(),
    })

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    const jobs = await queues.Queue.broadcasts().getJobs()

    const broadcastsQueueJobs = jobs.filter((job) => job.data.broadcastId === broadcastId)

    const abTestsJobs = await queues.Queue.abTestsBroadcasts().getJobs()

    const abTestsBroadcastsQueueJobs = abTestsJobs.filter(
      (job) => job.data.broadcastId === broadcastId,
    )

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
