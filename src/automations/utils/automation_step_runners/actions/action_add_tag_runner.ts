import type {
  AutomationStep,
  Contact,
} from '@/database/schema/database_schema_types.js'
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from '@/automations/utils/automation_step_runners/automation_runner_contract.js'
import { ContactRepository } from '@/audiences/repositories/contact_repository.ts'
import { container } from '@/utils/typi.ts'
import {
  tags,
  type ACTION_ADD_TAG_CONFIGURATION,
} from '@/database/schema/schema.ts'
import { inArray } from 'drizzle-orm'

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

    const contactRepository = container.resolve(ContactRepository)

    // Automation will skip any tags that might have been deleted by the user.

    const validTags = await database
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, configuration.tagIds))

    await contactRepository.attachTags(
      this.contact.id,
      validTags.map((tag) => tag.id),
    )
  }
}
