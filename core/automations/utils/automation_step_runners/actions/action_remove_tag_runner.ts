import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import type { AutomationStepRunnerContract } from '#root/core/automations/utils/automation_step_runners/automation_runner_contract.js'

import type { AutomationStep, Contact } from '#root/database/database_schema_types.js'
import type { ACTION_REMOVE_TAG_CONFIGURATION } from '#root/database/schema.js'

import { container } from '#root/core/utils/typi.js'

export class RemoveTagAutomationStepRunner implements AutomationStepRunnerContract {
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run() {
    const configuration = this.automationStep
      .configuration as ACTION_REMOVE_TAG_CONFIGURATION

    const contactRepository = container.resolve(ContactRepository)

    await contactRepository.detachTags(this.contact.id, configuration.tagIds)
  }
}
