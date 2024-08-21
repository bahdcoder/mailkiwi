import { describe, test } from 'vitest'
import { createUser } from '@/tests/mocks/auth/users.ts'
import {
  refreshDatabase,
  refreshRedisDatabase,
  seedAutomation,
} from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import { faker } from '@faker-js/faker'
import { contacts } from '@/database/schema/schema.ts'
import { makeDatabase, makeRedis } from '@/shared/container/index.js'
import { cuid } from '@/shared/utils/cuid/cuid.ts'
import { RunAutomationForContactJob } from '@/automations/jobs/run_automation_for_contact_job.ts'
import { Queue } from '@/shared/queue/queue.ts'
import { RunAutomationStepForContactJob } from '@/automations/jobs/run_automation_step_for_contact_job.ts'

describe('Run automation for contact job', () => {
  test('successfully runs an automation job for a contact by queueing next job', async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId, receiveWelcomeEmailautomationStepId } =
      await seedAutomation({
        audienceId: audience.id,
      })

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationForContactJob().handle({
      database,
      redis: makeRedis(),
      payload: { automationId: automationId, contactId: contactId },
    })

    const automationsQueueJobs = await Queue.automations().getJobs()

    expect(automationsQueueJobs.length).toBe(1)

    const jobId = automationsQueueJobs[0].name

    const jobPayload = automationsQueueJobs[0].data

    expect(jobId).toBe(RunAutomationStepForContactJob.id)
    expect(jobPayload).toEqual({
      contactId: contactId,
      automationStepId: receiveWelcomeEmailautomationStepId,
    })
  })

  test('does not trigger job if contact does not match query conditions', async ({
    expect,
  }) => {
    await refreshRedisDatabase()
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

    const contactId = cuid()

    await database.insert(contacts).values(
      createFakeContact(audience.id, {
        id: contactId,
        email: faker.internet.exampleEmail(),
      }),
    )

    const result = await new RunAutomationForContactJob().handle({
      database,
      redis: makeRedis(),
      payload: { automationId: automationId, contactId: contactId },
    })

    const automationsQueueJobs = await Queue.automations().getJobs()

    expect(automationsQueueJobs.length).toBe(0)
    expect(result.success).toBe(true)
    expect(result.output).toBe(
      `No contact found with id ${contactId} that matches trigger conditions.`,
    )
  })

  test('correctly runs job if contact matches additional query conditions', async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId } = await seedAutomation({
      audienceId: audience.id,
    })

    const contactId = cuid()

    await database.insert(contacts).values(
      createFakeContact(audience.id, {
        id: contactId,
      }),
    )

    const result = await new RunAutomationForContactJob().handle({
      database,
      redis: makeRedis(),
      payload: { automationId: automationId, contactId: contactId },
    })

    const automationsQueueJobs = await Queue.automations().getJobs()

    expect(automationsQueueJobs.length).toBe(1)
    expect(result.success).toBe(true)
  })
})
