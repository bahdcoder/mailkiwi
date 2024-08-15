import { describe, test, vi } from 'vitest'
import { createUser } from '@/tests/mocks/auth/users.ts'
import * as queues from '@/shared/queue/queue.js'
import { refreshDatabase, seedAutomation } from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import { faker } from '@faker-js/faker'
import {
  automationSteps,
  contactAutomationSteps,
  contacts,
} from '@/database/schema/schema.ts'
import { makeDatabase } from '@/shared/container/index.js'
import { SendBroadcastJob } from '@/broadcasts/jobs/send_broadcast_job.ts'
import { Job } from 'bullmq'
import { cuid } from '@/shared/utils/cuid/cuid.ts'
import { and, eq } from 'drizzle-orm'
import { RunAutomationStepJob } from '@/automations/jobs/run_automation_step_job.ts'

describe('Run automation step job', () => {
  test('dispatches a run automation step for contact job for each contact at this step', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId } = await seedAutomation({
      audienceId: audience.id,
    })

    const totalContacts = 373
    const totalContactsNotAtStep = 32

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, 'addBulk')
      .mockImplementation(async () => [
        new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      ])

    const contactIds = faker.helpers.multiple(cuid, { count: totalContacts })

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: totalContacts })
          .map((_, idx) =>
            createFakeContact(audience.id, { id: contactIds[idx] }),
          ),
      )

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: totalContactsNotAtStep })
          .map(() => createFakeContact(audience.id)),
      )

    const automationStepSendEmail =
      await database.query.automationSteps.findFirst({
        where: and(
          eq(automationSteps.automationId, automationId),
          eq(automationSteps.subtype, 'ACTION_SEND_EMAIL'),
        ),
      })

    // Insert automation steps for contacts before starting to process job.
    await database.insert(contactAutomationSteps).values(
      contactIds.map((contactId) => ({
        contactId,
        status: 'PENDING' as const,
        automationStepId: automationStepSendEmail?.id ?? '',
      })),
    )

    await new RunAutomationStepJob().handle({
      database,
      payload: { automationStepId: automationStepSendEmail?.id ?? '' },
    })

    const calls = automationsQueueMock.mock.calls

    const expectedBatches = Math.ceil(totalContacts / 75)

    expect(calls.length).toBe(expectedBatches)
    expect(calls.flat().flat()).toHaveLength(totalContacts)
  })
})
