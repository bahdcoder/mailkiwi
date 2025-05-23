import { and, eq } from 'drizzle-orm'
import { AutomationStepRunner } from '../utils/automation_step_runners/automation_step_runner.js'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'

import { contactAutomationSteps } from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface RunAutomationStepForContactJobPayload {
  automationStepId: string
  contactId: string
}

export class RunAutomationStepForContactJob extends BaseJob<RunAutomationStepForContactJobPayload> {
  static get id() {
    return 'AUTOMATIONS::RUN_AUTOMATION_STEP_FOR_CONTACT'
  }

  static get queue() {
    return AVAILABLE_QUEUES.automations
  }

  async handle({
    database,
    payload,
    redis,
  }: JobContext<RunAutomationStepForContactJobPayload>) {
    const [automationStep, contact, [contactAutomationStep]] = await Promise.all([
      container.make(AutomationStepRepository).findById(payload.automationStepId),
      container.make(ContactRepository).findById(payload.contactId),
      await database
        .select()
        .from(contactAutomationSteps)
        .where(
          and(
            eq(contactAutomationSteps.contactId, payload.contactId),
            eq(contactAutomationSteps.automationStepId, payload.automationStepId),
          ),
        ),
    ])

    if (contactAutomationStep) {
      return this.done(`Automation step already ran for contact ${payload.contactId}`)
    }

    if (!automationStep) {
      return this.done(
        `Automation step not found with id ${payload.automationStepId}. Might have been deleted after job was queued.`,
      )
    }

    if (!contact) {
      return this.done(`Contact not found with id ${payload.contactId}.`)
    }

    await new AutomationStepRunner(automationStep)
      .forContact(contact)
      .run({ database, redis })

    // get all automation step executors.
    // find the correct executor for this job.
    // invoke it.
    // in case of error, mark it as failed job.
    // alert customer support that this job is failing.
    // customer support chooses how to proceed.
    // mark step as failed. failed jobs just stay here for the contact.
    // the contact does not progress to the next step.

    // execute it for this contact
    // save the results to automation results for contact
    return this.done()
  }

  async failed() {}
}
