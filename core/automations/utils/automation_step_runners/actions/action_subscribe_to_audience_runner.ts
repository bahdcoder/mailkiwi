import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'

import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from '#root/core/automations/utils/automation_step_runners/automation_runner_contract.js'

import type { AutomationStep, Contact } from '#root/database/database_schema_types.js'
import {
  type ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION,
  contacts,
} from '#root/database/schema.js'

import { container } from '#root/core/utils/typi.js'

export class SubscribeToAudienceAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION

    const audienceRepository = container.resolve(AudienceRepository)

    const audience = await audienceRepository.findById(configuration.audienceId)

    if (!audience) {
      return
    }

    const { email, firstName, lastName, attributes } = this.contact

    await database.insert(contacts).values({
      email,
      firstName,
      lastName,
      attributes,
      audienceId: configuration.audienceId,
    })
  }
}
