import type { CreateAutomationDto } from '#root/core/automations//dto/create_automation_dto.js'
import { AutomationRepository } from '#root/core/automations/repositories/automation_repository.js'

import { container } from '#root/core/utils/typi.js'

export class CreateAutomationAction {
  constructor(
    private automationRepository: AutomationRepository = container.make(
      AutomationRepository,
    ),
  ) {}

  handle = async (payload: CreateAutomationDto, audienceId: string) => {
    const automation = await this.automationRepository.create(payload, audienceId)

    return automation
  }
}
