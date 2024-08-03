import type { AutomationStep, Contact } from "@/database/schema/types.js";
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from "@/automations/utils/automation_step_runners/automation_runner_contract.js";
import { container } from "@/utils/typi.ts";
import {
  contacts,
  type ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION,
} from "@/database/schema/schema.ts";
import { AudienceRepository } from "@/audiences/repositories/audience_repository.ts";

export class SubscribeToAudienceAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION;

    const audienceRepository = container.resolve(AudienceRepository);

    const audience = await audienceRepository.findById(
      configuration.audienceId,
    );

    if (!audience) {
      return;
    }

    const { email, firstName, lastName, attributes } = this.contact;

    await database.insert(contacts).values({
      email,
      firstName,
      lastName,
      attributes,
      audienceId: configuration.audienceId,
    });
  }
}
