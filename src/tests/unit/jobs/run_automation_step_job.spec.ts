import { describe, test, vi } from 'vitest'
import { createUser } from '@/tests/mocks/auth/users.ts'
import * as queues from '@/shared/queue/queue.js'
import {
  refreshDatabase,
  refreshRedisDatabase,
  seedAutomation,
} from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import { faker } from '@faker-js/faker'
import {
  automationSteps,
  contactAutomationSteps,
  contacts,
} from '@/database/schema/schema.ts'
import { makeDatabase, makeRedis } from '@/shared/container/index.js'
import { cuid } from '@/shared/utils/cuid/cuid.ts'
import { and, eq } from 'drizzle-orm'
import { RunAutomationStepJob } from '@/automations/jobs/run_automation_step_job.ts'

describe('Run automation step job', () => {
  test('dispatches a run automation step for contact job for each contact at this step', async ({
    expect,
  }) => {
    await refreshDatabase()
    await refreshRedisDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { id: automationId } = await seedAutomation({
      audienceId: audience.id,
    })

    const totalContacts = 373
    const totalContactsNotAtStep = 32

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
      redis: makeRedis(),
      payload: { automationStepId: automationStepSendEmail?.id ?? '' },
    })

    const automationsQueueJobs = await queues.Queue.automations().getJobs()

    expect(automationsQueueJobs).toHaveLength(totalContacts)
  })
})
