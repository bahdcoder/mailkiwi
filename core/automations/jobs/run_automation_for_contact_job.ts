import { and, eq } from 'drizzle-orm'
import { RunAutomationStepForContactJob } from './run_automation_step_for_contact_job.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import { AutomationRepository } from '#root/core/automations/repositories/automation_repository.js'

import {
  type TRIGGER_CONFIGURATION,
  automationSteps,
  contactAutomationSteps,
  contacts,
} from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

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

  async handle({ database, payload }: JobContext<RunAutomationForContactJobPayload>) {
    // check if contact matches the trigger for this automation.

    const automation = await container
      .make(AutomationRepository)
      .findById(payload.automationId)

    const trigger = await database.query.automationSteps.findFirst({
      where: and(
        eq(automationSteps.type, 'TRIGGER'),
        eq(automationSteps.automationId, payload.automationId),
      ),
    })

    if (!trigger) {
      return this.fail(`No trigger found for automation with id ${payload.automationId}`)
    }

    const audience = await container
      .make(AudienceRepository)
      .findById(automation.audienceId)

    const contact = await database.query.contacts.findFirst({
      where: and(
        eq(contacts.id, payload.contactId),
        new SegmentBuilder(
          (trigger.configuration as TRIGGER_CONFIGURATION)?.filterGroups,
          audience,
        ).build(),
      ),
    })

    if (!contact) {
      return this.done(
        `No contact found with id ${payload.contactId} that matches trigger conditions.`,
      )
    }

    const nextAutomationStep = await database.query.automationSteps.findFirst({
      where: and(
        eq(automationSteps.parentId, trigger.id),
        eq(automationSteps.automationId, payload.automationId),
      ),
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

  async failed() {}
}
