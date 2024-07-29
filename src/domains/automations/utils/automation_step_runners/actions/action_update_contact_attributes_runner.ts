import type {
  AutomationStep,
  Contact,
} from '@/infrastructure/database/schema/types.js'
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from '@/domains/automations/utils/automation_step_runners/automation_runner_contract.js'
import { ContactRepository } from '@/domains/audiences/repositories/contact_repository.ts'
import { container } from '@/utils/typi.ts'
import {
  tags,
  type ACTION_UPDATE_CONTACT_ATTRIBUTES,
} from '@/infrastructure/database/schema/schema.ts'
import { inArray } from 'drizzle-orm'

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
