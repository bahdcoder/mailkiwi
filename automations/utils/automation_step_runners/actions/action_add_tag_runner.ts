import { inArray } from "drizzle-orm"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from "@/automations/utils/automation_step_runners/automation_runner_contract.js"

import type {
  AutomationStep,
  Contact,
} from "@/database/database_schema_types.js"
import {
  type ACTION_ADD_TAG_CONFIGURATION,
  tags,
} from "@/database/schema.js"

import { container } from "@/utils/typi.js"

export class AddTagAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_ADD_TAG_CONFIGURATION

    await container
      .resolve(ContactRepository)
      .attachTags(this.contact.id, configuration.tagIds)
  }
}
