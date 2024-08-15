import { describe, test, vi } from 'vitest'
import { createBroadcastForUser, createUser } from '@/tests/mocks/auth/users.ts'
import * as queues from '@/shared/queue/queue.js'
import { refreshDatabase } from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import { faker } from '@faker-js/faker'
import { broadcasts, contacts, segments } from '@/database/schema/schema.ts'
import { makeDatabase, makeRedis } from '@/shared/container/index.js'
import { SendBroadcastJob } from '@/broadcasts/jobs/send_broadcast_job.ts'
import { Job } from 'bullmq'
import { SendBroadcastToContact } from '@/broadcasts/jobs/send_broadcast_to_contact_job.ts'
import { cuid } from '@/shared/utils/cuid/cuid.ts'
import { eq } from 'drizzle-orm'

describe('Send broadcast job', () => {
  test('queues send email jobs for all contacts in audience for the broadcast', async ({
    expect,
  }) => {
    await refreshDatabase()

    const database = makeDatabase()

    const broadcastQueueMock = vi
      .spyOn(queues.BroadcastsQueue, 'addBulk')
      .mockImplementation(async () => [
        new Job(queues.BroadcastsQueue, SendBroadcastJob.id, {}),
      ])

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })
    const { audience: otherAudience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    const contactsForAudience = 13

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
    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 23 })
          .map(() => createFakeContact(otherAudience.id)),
      )

    await new SendBroadcastJob().handle({
      database,
      payload: { broadcastId },
      redis: makeRedis(),
    })

    const mockCalls = broadcastQueueMock.mock.calls[0][0].sort(
      (callA, callB) => (callA.data.contactId > callB.data.contactId ? 1 : -1),
    )

    expect(mockCalls).toHaveLength(contactsForAudience)

    const contactIdsSorted = contactIds.sort((idA, idB) => (idA > idB ? 1 : -1))

    for (const [idx, job] of mockCalls.entries()) {
      expect(job.name).toBe(SendBroadcastToContact.id)
      expect(job.data).toStrictEqual({
        contactId: contactIdsSorted[idx],
        broadcastId,
      })
    }
  })

  test('queues send email jobs for a specific segment of contacts in audience if segment is defined', async ({
    expect,
  }) => {
    await refreshDatabase()

    const database = makeDatabase()

    const broadcastQueueMock = vi
      .spyOn(queues.BroadcastsQueue, 'addBulk')
      .mockImplementation(async () => [
        new Job(queues.BroadcastsQueue, SendBroadcastJob.id, {}),
      ])

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })
    const { audience: otherAudience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    const segmentId = cuid()

    const emailStartsWith = faker.string.uuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      conditions: [
        {
          field: 'email',
          operation: 'startsWith',
          value: emailStartsWith,
        },
      ],
    })

    await database
      .update(broadcasts)
      .set({ segmentId })
      .where(eq(broadcasts.id, broadcastId))

    const contactsForAudience = 6

    const contactIds = faker.helpers.multiple(cuid, {
      count: contactsForAudience,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, { count: contactsForAudience })
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: contactIds[idx],
            email: emailStartsWith + faker.internet.email(),
          }),
        ),
    )
    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 55 })
          .map(() => createFakeContact(audience.id)),
      )
    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 23 })
          .map(() => createFakeContact(otherAudience.id)),
      )

    await new SendBroadcastJob().handle({
      database,
      payload: { broadcastId },
      redis: makeRedis(),
    })

    const mockCalls = broadcastQueueMock.mock.calls[0][0]

    expect(mockCalls).toHaveLength(contactsForAudience)

    for (const [, job] of mockCalls.entries()) {
      const findContactId = contactIds.find((id) => id === job.data.contactId)

      expect(job.name).toBe(SendBroadcastToContact.id)
      expect(job.data).toStrictEqual({
        contactId: findContactId,
        broadcastId,
      })
    }
  })
})
