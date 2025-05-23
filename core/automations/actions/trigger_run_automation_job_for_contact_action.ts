import type { automationStepSubtypesTrigger } from '#root/database/schema.js'

export class TriggerRunAutomationJobForContactAction {
  async handle(
    trigger: (typeof automationStepSubtypesTrigger)[number],
    contactId: string,
  ) {
    // receive contact id
  }
}
