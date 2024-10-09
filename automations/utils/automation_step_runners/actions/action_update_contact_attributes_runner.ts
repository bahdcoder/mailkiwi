import { inArray } from "drizzle-orm"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from "@/automations/utils/automation_step_runners/automation_runner_contract.js"

import type {
  AutomationStep,
  Contact,
} from "@/database/schema/database_schema_types.js"
import {
  type ACTION_UPDATE_CONTACT_ATTRIBUTES,
  tags,
} from "@/database/schema/schema.js"

import { container } from "@/utils/typi.js"

export class UpdateContactAttributesAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_UPDATE_CONTACT_ATTRIBUTES

    const contactRepository = container.resolve(ContactRepository)

    await contactRepository.update(this.contact.id, {
      attributes: configuration.attributes,
    })
  }
}
