import type {
  AutomationStep,
  Contact,
} from '@/database/schema/database_schema_types.js'
import type { AutomationStepRunnerContract } from '@/automations/utils/automation_step_runners/automation_runner_contract.js'
import { ContactRepository } from '@/audiences/repositories/contact_repository.ts'
import { container } from '@/utils/typi.ts'
import type { ACTION_REMOVE_TAG_CONFIGURATION } from '@/database/schema/schema.ts'

export class RemoveTagAutomationStepRunner
  implements AutomationStepRunnerContract
{
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
