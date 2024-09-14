import type { CreateAutomationDto } from "@/automations//dto/create_automation_dto.js"
import { AutomationRepository } from "@/automations/repositories/automation_repository.js"

import { container } from "@/utils/typi.js"

export class CreateAutomationAction {
  constructor(
    private automationRepository: AutomationRepository = container.make(
      AutomationRepository,
    ),
  ) {}

  handle = async (payload: CreateAutomationDto, audienceId: number) => {
    const automation = await this.automationRepository.create(
      payload,
      audienceId,
    )

    return automation
  }
}
