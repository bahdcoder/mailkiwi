import type { CreateAutomationStepDto } from '@/automations/dto/create_automation_step_dto.js'
import { AutomationStepRepository } from '@/automations/repositories/automation_step_repository.js'
import { container } from '@/utils/typi.js'

export class CreateAutomationStepAction {
  constructor(
    private automationStepRepository: AutomationStepRepository = container.make(
      AutomationStepRepository,
    ),
  ) {}

  handle = async (automationId: string, data: CreateAutomationStepDto) => {
    return this.automationStepRepository.create(automationId, data)
  }
}
