import type { CreateAutomationStepDto } from '@/automations/dto/create_automation_step_dto.js'
import { AutomationRepository } from '@/automations/repositories/automation_repository.js'

import { container } from '@/utils/typi.js'

export class GetAutomationAction {
  constructor(private automationRepository = container.make(AutomationRepository)) {}

  handle = async (automationId: string) => {
    return this.automationRepository.findById(automationId)
  }
}
