import type { CreateAutomationStepDto } from '#root/core/automations/dto/create_automation_step_dto.js'
import { AutomationRepository } from '#root/core/automations/repositories/automation_repository.js'

import { container } from '@kibamail/framework'

export class GetAutomationAction {
  constructor(private automationRepository = container.make(AutomationRepository)) {}

  handle = async (automationId: string) => {
    return this.automationRepository.findById(automationId)
  }
}
