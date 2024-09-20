import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { SendBroadcastJob } from "@/broadcasts/jobs/send_broadcast_job.js"
import { SendBroadcastToContact } from "@/broadcasts/jobs/send_broadcast_to_contact_job.js"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.js"
import {
  createBroadcastForUser,
  createUser,
} from "@/tests/mocks/auth/users.js"

import {
  broadcasts,
  contacts,
  segments,
} from "@/database/schema/schema.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import * as queues from "@/shared/queue/queue.js"

describe("@broadcasts send job", () => {
  test("queues send email jobs for all contacts in audience for the broadcast", async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })
    const { audience: otherAudience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    const contactsForAudience = 13

    const contactIds = faker.helpers.multiple(faker.number.int, {
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

    const jobs = await queues.Queue.broadcasts().getJobs()

    const broadcastsQueueJobs = jobs.filter(
      (job) => job.data.broadcastId === broadcastId,
    )

    const sortedBroadcastsQueueJobs = broadcastsQueueJobs.sort(
      (jobA, jobB) => (jobA.data.contactId > jobB.data.contactId ? 1 : -1),
    )

    expect(broadcastsQueueJobs).toHaveLength(contactsForAudience)

    const contactIdsSorted = contactIds.sort((idA, idB) =>
      idA > idB ? 1 : -1,
    )

    for (const [idx, job] of sortedBroadcastsQueueJobs.entries()) {
      expect(job.name).toBe(SendBroadcastToContact.id)
      expect(job.data).toStrictEqual({
        contactId: contactIdsSorted[idx],
        broadcastId,
      })
    }
  })

  test("queues send email jobs for a specific segment of contacts in audience if segment is defined", async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser({
      createMailerWithIdentity: true,
    })
    const { audience: otherAudience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    const emailStartsWith = faker.string.uuid()

    const segmentInsert = await database.insert(segments).values({
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: "AND",
        groups: [
          {
            type: "AND",
            conditions: [
              {
                field: "email",
                operation: "startsWith",
                value: emailStartsWith,
              },
            ],
          },
        ],
      },
    })

    const segmentId = segmentInsert?.[0]?.insertId

    await database
      .update(broadcasts)
      .set({ segmentId })
      .where(eq(broadcasts.id, broadcastId))

    const contactsForAudience = 6

    const contactIds = faker.helpers.multiple(faker.number.int, {
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

    const jobs = await queues.Queue.broadcasts().getJobs()

    const broadcastsQueueJobs = jobs.filter(
      (job) => job.data.broadcastId === broadcastId,
    )

    expect(broadcastsQueueJobs).toHaveLength(contactsForAudience)

    for (const [, job] of broadcastsQueueJobs.entries()) {
      const findContactId = contactIds.find(
        (id) => id === job.data.contactId,
      )

      expect(job.name).toBe(SendBroadcastToContact.id)
      expect(job.data).toStrictEqual({
        contactId: findContactId,
        broadcastId,
      })
    }
  })
})
