import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'
import { Queue } from '@/shared/queue/queue.js'
import {
  automationSteps,
  contactAutomationSteps,
  contacts,
  type TRIGGER_CONFIGURATION,
} from '@/database/schema/schema.ts'
import { and, eq } from 'drizzle-orm'
import { RunAutomationStepForContactJob } from './run_automation_step_for_contact_job.ts'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.ts'

export interface RunAutomationForContactJobPayload {
  automationId: string
  contactId: string
}

export class RunAutomationForContactJob extends BaseJob<RunAutomationForContactJobPayload> {
  static get id() {
    return 'AUTOMATIONS::RUN_AUTOMATION_FOR_CONTACT'
  }

  static get queue() {
    return AVAILABLE_QUEUES.automations
  }

  async handle({
    database,
    payload,
  }: JobContext<RunAutomationForContactJobPayload>) {
    // check if contact matches the trigger for this automation.
    const trigger = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.type, 'TRIGGER'),
    })

    if (!trigger) {
      return this.fail(
        `No trigger found for automation with id ${payload.automationId}`,
      )
    }

    const contact = await database.query.contacts.findFirst({
      where: and(
        eq(contacts.id, payload.contactId),
        new SegmentBuilder(
          (trigger.configuration as TRIGGER_CONFIGURATION)?.conditions ?? [],
        ).build(),
      ),
    })

    if (!contact) {
      return this.done(
        `No contact found with id ${payload.contactId} that matches trigger conditions.`,
      )
    }

    const nextAutomationStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.parentId, trigger.id),
    })

    if (!nextAutomationStep) {
      return this.fail(
        `No next step found for automation with id ${payload.automationId} and trigger with Id ${trigger.id}`,
      )
    }

    await database.transaction(async (trx) => {
      await trx.insert(contactAutomationSteps).values({
        contactId: payload.contactId,
        automationStepId: nextAutomationStep.id,
        status: 'COMPLETED',
      })

      await Queue.automations().add(RunAutomationStepForContactJob.id, {
        contactId: payload.contactId,
        automationStepId: nextAutomationStep.id,
      })
    })

    return this.done()
  }
}
