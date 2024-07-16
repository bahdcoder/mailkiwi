import { inject, injectable } from "tsyringe"

import { CreateAutomationDto } from "@/domains/automations//dto/create_automation_dto.ts"
import { AutomationRepository } from "@/domains/automations/repositories/automation_repository.ts"

@injectable()
export class CreateAutomationAction {
  constructor(
    @inject(AutomationRepository)
    private automationRepository: AutomationRepository,
  ) {}

  handle = async (payload: CreateAutomationDto, audienceId: string) => {
    const automation = await this.automationRepository.create(
      payload,
      audienceId,
    )

    return automation
  }
}
