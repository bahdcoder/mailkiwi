import { E_OPERATION_FAILED } from '@/http/responses/errors.ts'
import type {
  AutomationStep,
  Contact,
} from '@/infrastructure/database/schema/types.ts'
import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
  AutomationStepRunnerContractConstructor,
} from './automation_runner_contract.ts'
import { AddTagAutomationStepRunner } from './actions/action_add_tag_runner.ts'
import { SendEmailAutomationStepRunner } from './actions/action_send_email_runner.ts'
import { contactAutomationSteps } from '@/infrastructure/database/schema/schema.ts'

export class AutomationStepRunner {
  private contact: Contact
  protected runners: Partial<
    Record<AutomationStep['subtype'], AutomationStepRunnerContractConstructor>
  > = {
    ACTION_ADD_TAG: AddTagAutomationStepRunner,
    ACTION_SEND_EMAIL: SendEmailAutomationStepRunner,
  }

  constructor(private automationStep: AutomationStep) {}

  forContact(contact: Contact) {
    this.contact = contact

    return this
  }

  async run({ database }: AutomationStepRunnerContext) {
    if (!this.contact) {
      throw E_OPERATION_FAILED('Contact not set for automation step runner.')
    }

    const Runner = this.runners[this.automationStep.subtype]

    if (!Runner) {
      throw E_OPERATION_FAILED(
        `Runner for automation step subtype ${this.automationStep.subtype} has not been defined.`,
      )
    }

    await new Runner(this.automationStep, this.contact).run({ database })

    await database.insert(contactAutomationSteps).values({
      contactId: this.contact.id,
      automationStepId: this.automationStep.id,
      status: 'COMPLETED',
      completedAt: new Date(),
    })
  }
}
