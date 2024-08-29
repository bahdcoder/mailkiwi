import { AutomationStepRunner } from "../utils/automation_step_runners/automation_step_runner.ts"
import { and, eq } from "drizzle-orm"

import {
  automationSteps,
  contactAutomationSteps,
  contacts,
} from "@/database/schema/schema.ts"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

export interface RunAutomationStepForContactJobPayload {
  automationStepId: string
  contactId: string
}

export class RunAutomationStepForContactJob extends BaseJob<RunAutomationStepForContactJobPayload> {
  static get id() {
    return "AUTOMATIONS::RUN_AUTOMATION_STEP_FOR_CONTACT"
  }

  static get queue() {
    return AVAILABLE_QUEUES.automations
  }

  async handle({
    database,
    payload,
    redis,
  }: JobContext<RunAutomationStepForContactJobPayload>) {
    const [automationStep, contact, contactAutomationStep] =
      await Promise.all([
        database.query.automationSteps.findFirst({
          where: eq(automationSteps.id, payload.automationStepId),
        }),
        database.query.contacts.findFirst({
          where: eq(contacts.id, payload.contactId),
        }),
        database.query.contactAutomationSteps.findFirst({
          where: and(
            eq(contactAutomationSteps.contactId, payload.contactId),
            eq(
              contactAutomationSteps.automationStepId,
              payload.automationStepId,
            ),
          ),
        }),
      ])

    if (contactAutomationStep) {
      return this.done(
        `Automation step already ran for contact ${payload.contactId}`,
      )
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
}
