import { CreateAutomationDto } from "@/domains/automations//dto/create_automation_dto.ts"
import { AutomationRepository } from "@/domains/automations/repositories/automation_repository.ts"
import { container } from "@/utils/typi.js"

export class CreateAutomationAction {
  constructor(
    private automationRepository: AutomationRepository = container.make(
      AutomationRepository,
    ),
  ) {}

  handle = async (payload: CreateAutomationDto, audienceId: string) => {
    const automation = await this.automationRepository.create(
      payload,
      audienceId,
    )

    return automation
  }
}
