import {
  type InferInput,
  array,
  checkAsync,
  number,
  objectAsync,
  optional,
  picklist,
  pipeAsync,
  string,
  unknown,
} from 'valibot'

import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'

import {
  automationStepSubtypes,
  automationStepTypes,
} from '#root/database/types/automations.js'

import { container } from '#root/core/utils/typi.js'

async function automationStepIdRequirement(input: string): Promise<boolean> {
  if (!input) return true

  const automationStepRepository = container.make(AutomationStepRepository)

  const automationStep = await automationStepRepository.findById(input)

  return automationStep !== undefined
}
export const CreateAutomationStepDto = pipeAsync(
  objectAsync({
    type: picklist(automationStepTypes),
    subtype: picklist(automationStepSubtypes),
    configuration: optional(unknown()),
    parentId: pipeAsync(
      string(),
      checkAsync(
        automationStepIdRequirement,
        'The parentId must be a valid automation step ID.',
      ),
    ),
    emailId: optional(string()),
    audienceId: optional(string()),
    tagId: optional(string()),
    targetId: pipeAsync(
      string(),
      checkAsync(
        automationStepIdRequirement,
        'The targetId must be a valid automation step ID.',
      ),
    ),
    branchIndex: optional(number()),
  }),
  checkAsync((input) => {
    if (input.type === 'END') return true

    return input.subtype.startsWith(input.type)
  }, 'The subtype must be valid for the type.'),
)

export type CreateAutomationStepDto = InferInput<typeof CreateAutomationStepDto>
