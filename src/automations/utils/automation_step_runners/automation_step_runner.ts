import { AddTagAutomationStepRunner } from "./actions/action_add_tag_runner.js"
import { RemoveTagAutomationStepRunner } from "./actions/action_remove_tag_runner.js"
import { SendEmailAutomationStepRunner } from "./actions/action_send_email_runner.js"
import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContractConstructor,
} from "./automation_runner_contract.js"

import type {
  AutomationStep,
  Contact,
} from "@/database/schema/database_schema_types.js"
import { contactAutomationSteps } from "@/database/schema/schema.js"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

export class AutomationStepRunner {
  private contact: Contact
  protected runners: Partial<
    Record<
      AutomationStep["subtype"],
      AutomationStepRunnerContractConstructor
    >
  > = {
    ACTION_ADD_TAG: AddTagAutomationStepRunner,
    ACTION_SEND_EMAIL: SendEmailAutomationStepRunner,
    ACTION_REMOVE_TAG: RemoveTagAutomationStepRunner,
  }

  constructor(private automationStep: AutomationStep) {}

  forContact(contact: Contact) {
    this.contact = contact

    return this
  }

  async run({ database, redis }: AutomationStepRunnerContext) {
    if (!this.contact) {
      throw E_OPERATION_FAILED(
        "Contact not set for automation step runner.",
      )
    }

    const Runner = this.runners[this.automationStep.subtype]

    if (!Runner) {
      throw E_OPERATION_FAILED(
        `Runner for automation step subtype ${this.automationStep.subtype} has not been defined.`,
      )
    }

    await new Runner(this.automationStep, this.contact).run({
      database,
      redis,
    })

    await database.insert(contactAutomationSteps).values({
      contactId: this.contact.id,
      automationStepId: this.automationStep.id,
      status: "COMPLETED",
      completedAt: new Date(),
    })
  }
}
