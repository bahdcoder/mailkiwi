import { describe, test, vi } from 'vitest'
import { createUser } from '@/tests/mocks/auth/users.ts'
import * as queues from '@/domains/shared/queue/queue.js'
import { refreshDatabase, seedAutomation } from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import { faker } from '@faker-js/faker'
import { contacts } from '@/infrastructure/database/schema/schema.ts'
import { makeDatabase } from '@/infrastructure/container.ts'
import { SendBroadcastJob } from '@/domains/broadcasts/jobs/send_broadcast_job.ts'
import { Job } from 'bullmq'
import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'
import { RunAutomationForContactJob } from '@/domains/automations/jobs/run_automation_for_contact_job.ts'
import { RunAutomationStepForContactJob } from '@/domains/automations/jobs/run_automation_step_for_contact_job.ts'

describe('Run automation for contact job', () => {
  test('successfully runs an automation job for a contact by queueing next job', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId, receiveWelcomeEmailautomationStepId } =
      await seedAutomation({
        audienceId: audience.id,
      })

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, 'add')
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      )

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationForContactJob().handle({
      database,
      payload: { automationId: automationId, contactId: contactId },
    })

    const calls = automationsQueueMock.mock.calls

    expect(calls.length).toBe(1)

    const jobId = calls[0][0]
    const jobPayload = calls[0][1]

    expect(jobId).toBe(RunAutomationStepForContactJob.id)
    expect(jobPayload).toEqual({
      contactId: contactId,
      automationStepId: receiveWelcomeEmailautomationStepId,
    })
  })

  test('does not trigger job if contact does not match query conditions', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId, receiveWelcomeEmailautomationStepId } =
      await seedAutomation({
        audienceId: audience.id,
        triggerConditions: [
          {
            field: 'email',
            operation: 'endsWith',
            value: '@gmail.com',
          },
        ],
      })

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, 'add')
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      )

    const contactId = cuid()

    await database.insert(contacts).values(
      createFakeContact(audience.id, {
        id: contactId,
        email: faker.internet.exampleEmail(),
      }),
    )

    const result = await new RunAutomationForContactJob().handle({
      database,
      payload: { automationId: automationId, contactId: contactId },
    })

    const calls = automationsQueueMock.mock.calls

    expect(calls.length).toBe(0)
    expect(result.success).toBe(true)
    expect(result.output).toBe(
      `No contact found with id ${contactId} that matches trigger conditions.`,
    )
  })

  test('correctly runs job if contact matches additional query conditions', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId, receiveWelcomeEmailautomationStepId } =
      await seedAutomation({
        audienceId: audience.id,
      })

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, 'add')
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      )

    const contactId = cuid()

    await database.insert(contacts).values(
      createFakeContact(audience.id, {
        id: contactId,
      }),
    )

    const result = await new RunAutomationForContactJob().handle({
      database,
      payload: { automationId: automationId, contactId: contactId },
    })

    const calls = automationsQueueMock.mock.calls

    expect(calls.length).toBe(1)
    expect(result.success).toBe(true)
  })
})
