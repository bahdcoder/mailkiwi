import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { SendAbTestBroadcastJob } from '#root/core/broadcasts/jobs/send_ab_test_broadcast_job.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createBroadcastForUser, createUser } from '#root/core/tests/mocks/auth/users.js'

import { abTestVariants, contacts } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { hoursToSeconds } from '#root/core/utils/dates.js'
import { container } from '#root/core/utils/typi.js'

describe('@abtests Pick Test winner', () => {
  test('picks A/B test winner for click rate winning criteria', async ({ expect }) => {
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

    const broadcast = await container.make(BroadcastRepository).findById(broadcastId)

    const jobs = await Queue.broadcasts().getJobs()

    const jobsFromBroadcastsQueue = jobs.filter(
      (job) => job.data.broadcastId === broadcastId,
    )
    const abTestsJobs = await Queue.abTestsBroadcasts().getJobs()

    const jobsFromAbTestBroadcastQueue = abTestsJobs.filter(
      (job) => job.data.broadcastId === broadcastId,
    )

    expect(jobsFromBroadcastsQueue).toHaveLength(contactsForAudience)

    const allVariants = await database
      .select()
      .from(abTestVariants)
      .where(eq(abTestVariants.broadcastId, broadcastId))

    const totalSentToVariants = jobsFromBroadcastsQueue.filter(
      (job) => !job.data.isAbTestFinalSample,
    ).length

    expect(totalSentToVariants).toBe(expectedTotalWeightsRecipients)

    const finalSampleSize = contactsForAudience - expectedTotalWeightsRecipients

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

  test.todo(
    'picks A/B test winner for open rate winning criteria',
    async ({ expect }) => {},
  )

  test.todo(
    'picks A/B test winner for open rate winning criteria',
    async ({ expect }) => {},
  )
})
