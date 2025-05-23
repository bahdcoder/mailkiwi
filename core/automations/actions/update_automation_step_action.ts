import { FilterGroupsSchema } from '#root/core/audiences/dto/segments/create_segment_dto.js'
import type { UpdateAutomationStepDto } from '#root/core/automations/dto/update_automation_step_dto.js'
import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'
import type { AutomationStep } from '#root/database/database_schema_types.js'
import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'
import { container } from '#root/core/utils/typi.js'
import {
  type BaseIssue,
  type BaseSchema,
  array,
  number,
  object,
  record,
  safeParse,
  string,
  union,
} from 'valibot'

export class UpdateAutomationStepAction {
  constructor(
    private automationStepRepository = container.make(AutomationStepRepository),
  ) {}

  handle = async (automationStep: AutomationStep, data: UpdateAutomationStepDto) => {
    this.validateStepConfiguration(automationStep, data)

    return this.automationStepRepository.updateConfiguration(automationStep.id, data)
  }

  private validateStepConfiguration(step: AutomationStep, data: UpdateAutomationStepDto) {
    if (step.subtype === 'ACTION_SEND_EMAIL' && !data.emailId && !step.emailId) {
      throw E_VALIDATION_FAILED([
        {
          field: 'emailId',
          message: 'The emailId must be present for subtype ACTION_SEND_EMAIL.',
        },
      ])
    }

    if (
      (step.subtype === 'ACTION_ADD_TAG' || step.subtype === 'ACTION_REMOVE_TAG') &&
      !data.tagId &&
      !step.tagId
    ) {
      throw E_VALIDATION_FAILED([
        {
          field: 'tagId',
          message:
            'The tagId must be present for subtype ACTION_ADD_TAG and ACTION_REMOVE_TAG.',
        },
      ])
    }

    let schema: BaseSchema<unknown, unknown, BaseIssue<unknown>> | undefined = undefined

    switch (step.subtype) {
      case 'RULE_IF_ELSE':
        schema = object({
          filterGroups: FilterGroupsSchema,
        })
        break

      case 'ACTION_UPDATE_CONTACT_ATTRIBUTES':
        schema = object({
          attributes: record(string(), union([string(), array(string())])),
        })
        break

      case 'RULE_WAIT_FOR_DURATION':
        schema = object({
          delay: number(),
        })
        break

      default:
        break
    }

    if (!schema) {
      return
    }

    const { success } = safeParse(schema, data.configuration)

    if (!success) {
      throw E_VALIDATION_FAILED([
        {
          field: 'configuration',
          message: `The configuration object for ${step.subtype} is malformed.`,
        },
      ])
    }
  }
}
