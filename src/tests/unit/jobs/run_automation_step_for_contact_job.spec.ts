import { describe, test, vi } from 'vitest'
import { createUser } from '@/tests/mocks/auth/users.ts'
import * as queues from '@/domains/shared/queue/queue.js'
import { Mailer } from '@/domains/shared/mailers/mailer.js'
import { refreshDatabase, seedAutomation } from '@/tests/mocks/teams/teams.ts'
import { createFakeContact } from '@/tests/mocks/audiences/contacts.ts'
import {
  contactAutomationSteps,
  contacts,
} from '@/infrastructure/database/schema/schema.ts'
import { makeDatabase } from '@/infrastructure/container.ts'
import { SendBroadcastJob } from '@/domains/broadcasts/jobs/send_broadcast_job.ts'
import { Job } from 'bullmq'
import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'
import { RunAutomationStepForContactJob } from '@/domains/automations/jobs/run_automation_step_for_contact_job.ts'
import type { MailerDriver } from '@/domains/shared/mailers/mailer_types.ts'
import { and, eq } from 'drizzle-orm'

describe('Run automation step for contact job', () => {
  test('successfully runs an automation step action for a contact', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()

    const { receiveWelcomeEmailautomationStepId } = await seedAutomation({
      audienceId: audience.id,
    })

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, 'add')
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      )

    const fakeSendFn = vi.fn()

    class FakeDriver implements MailerDriver {
      send = fakeSendFn
    }

    Mailer.setDriver(new FakeDriver())

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: receiveWelcomeEmailautomationStepId as string,
        contactId: contactId,
      },
    })

    expect(fakeSendFn.mock.calls).toHaveLength(1)

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          receiveWelcomeEmailautomationStepId ?? '',
        ),
        eq(contactAutomationSteps.status, 'COMPLETED'),
      ),
    })

    expect(completed).toBeDefined()
  })
})
