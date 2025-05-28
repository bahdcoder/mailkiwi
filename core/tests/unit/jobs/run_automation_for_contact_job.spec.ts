import { faker } from '@faker-js/faker'
import { describe, test } from 'vitest'

import { RunAutomationForContactJob } from '#root/core/automations/jobs/run_automation_for_contact_job.js'
import { RunAutomationStepForContactJob } from '#root/core/automations/jobs/run_automation_step_for_contact_job.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { seedAutomation } from '#root/core/tests/mocks/teams/teams.js'

import { contacts } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

describe('Run automation for contact job', () => {
  test('successfully runs an automation job for a contact by queueing next job', async ({
    expect,
  }) => {
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

    await new RunAutomationForContactJob().handle({
      database,
      redis: makeRedis(),
      payload: {
        automationId,
        contactId,
      },
      logger: makeLogger(),
    })

    const jobs = await Queue.automations().getJobs()

    const automationsQueueJobs = jobs.filter(
      (job) => job.data.contactId.toString() === contactId.toString(),
    )

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
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId } = await seedAutomation({
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
      payload: {
        automationId: automationId,
        contactId: contactId,
      },
      logger: makeLogger(),
    })

    const jobs = await Queue.automations().getJobs()

    const automationsQueueJobs = jobs.filter(
      (job) => job.data.contactId === contactId.toString(),
    )

    expect(automationsQueueJobs.length).toBe(0)
    expect(result.success).toBe(true)
    expect(result.output).toBe(
      `No contact found with id ${contactId} that matches trigger conditions.`,
    )
  })

  test('correctly runs job if contact matches additional query conditions', async ({
    expect,
  }) => {
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId } = await seedAutomation({
      audienceId: audience.id,
    })

    const contactId = cuid()

    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    const result = await new RunAutomationForContactJob().handle({
      database,
      redis: makeRedis(),
      payload: {
        automationId,
        contactId,
      },
      logger: makeLogger(),
    })

    const jobs = await Queue.automations().getJobs()

    const automationsQueueJobs = jobs.filter(
      (job) => job.data.contactId.toString() === contactId.toString(),
    )

    expect(automationsQueueJobs.length).toBe(1)
    expect(result.success).toBe(true)
  })
})
