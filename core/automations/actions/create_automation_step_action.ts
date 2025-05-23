import type { CreateAutomationStepDto } from '#root/core/automations/dto/create_automation_step_dto.js'
import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'

import { container } from '#root/core/utils/typi.js'

interface EdgeInfo {
  sourceId: string
  targetId: string
  branch?: 'YES' | 'NO'
}

export class CreateAutomationStepAction {
  constructor(
    private automationStepRepository = container.make(AutomationStepRepository),
  ) {}

  /**
   * Parse an edge ID into its component parts
   * Edge ID format: <source>-<target>-<branch?>
   * Where branch is optional and can be YES or NO for IF/ELSE edges
   */
  private parseEdgeId(edgeId?: string): EdgeInfo | null {
    if (!edgeId) return null

    const parts = edgeId.split('-')
    if (parts.length < 2) return null

    const sourceId = parts[0]
    const targetId = parts[1]
    const branch = parts[2] as 'YES' | 'NO' | undefined

    return { sourceId, targetId, branch }
  }

  /**
   * Handle the creation of an automation step
   *
   * @param automationId - The ID of the automation
   * @param data - The data for the new step
   * @param edgeId - Optional edge ID for inserting a step between existing steps
   */
  handle = async (automationId: string, data: CreateAutomationStepDto) => {
    if (data.subtype !== 'RULE_IF_ELSE') {
      return this.automationStepRepository.create(automationId, data)
    }

    const ifElseStep = await this.automationStepRepository.createIfElseStep(
      automationId,
      {
        ...data,
        parentId: data.parentId,
      },
      data.targetId as string,
    )

    return ifElseStep
  }
}
