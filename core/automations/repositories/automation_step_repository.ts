import { eq } from 'drizzle-orm'

import type { DrizzleClient } from '#root/database/client.js'
import {
  type AutomationStepConfiguration,
  automationSteps,
} from '#root/database/schema.js'

import type { CreateAutomationStepDto } from '#root/core/automations/dto/create_automation_step_dto.js'
import type { UpdateAutomationStepDto } from '#root/core/automations/dto/update_automation_step_dto.js'
import { AutomationStep } from '#root/database/database_schema_types.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { AUTOMATION_STEP_BRANCH_TYPES } from '#root/database/constants.js'

export class AutomationStepRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  /**
   * Create a standard automation step
   *
   * @param automationId - The ID of the automation
   * @param payload - The step data
   * @returns The created step ID
   */
  async create(automationId: string, { ...payload }: CreateAutomationStepDto) {
    const id = this.cuid()
    await this.database.transaction(async (trx) => {
      await trx.insert(automationSteps).values({
        id,
        ...payload,
        automationId,
        configuration: payload.configuration || ({} as AutomationStepConfiguration),
      })

      await trx
        .update(automationSteps)
        .set({
          parentId: id,
        })
        .where(eq(automationSteps.id, payload.targetId))
    })
    return { id }
  }

  /**
   * Create an IF/ELSE rule step with its branches
   *
   * @param automationId - The ID of the automation
   * @param payload - The IF/ELSE step data
   * @param targetId - The ID of the target step that will be connected to the YES branch
   * @returns The created IF/ELSE step ID and branch step IDs
   */
  async createIfElseStep(
    automationId: string,
    payload: CreateAutomationStepDto,
    targetId: string,
  ) {
    const ifElseStepId = this.cuid()
    const noBranchStepId = this.cuid()
    const noEndStepId = this.cuid()

    await this.database.transaction(async (trx) => {
      await trx.insert(automationSteps).values({
        id: ifElseStepId,
        automationId,
        type: 'RULE',
        subtype: 'RULE_IF_ELSE',
        parentId: payload.parentId,
        configuration: payload.configuration || {
          filterGroups: {
            type: 'AND',
            groups: [
              {
                type: 'AND',
                conditions: [],
              },
            ],
          },
        },
      })

      await trx
        .update(automationSteps)
        .set({ parentId: ifElseStepId })
        .where(eq(automationSteps.id, targetId))

      await trx.insert(automationSteps).values({
        id: noBranchStepId,
        automationId,
        type: 'ACTION',
        subtype: 'ACTION_EMPTY',
        parentId: ifElseStepId,
        branchIndex: AUTOMATION_STEP_BRANCH_TYPES.NO,
        configuration: {} as AutomationStepConfiguration,
      })

      await trx.insert(automationSteps).values({
        id: noEndStepId,
        automationId,
        type: 'END',
        subtype: 'END',
        parentId: noBranchStepId,
        configuration: {} as AutomationStepConfiguration,
      })
    })

    return {
      id: ifElseStepId,
      noBranchStepId,
      noEndStepId,
    }
  }

  /**
   * Find an automation step by ID
   *
   * @param automationStepId - The ID of the step to find
   * @returns The found step or undefined
   */
  async findById(automationStepId: string) {
    const [step] = await this.database
      .select()
      .from(automationSteps)
      .where(eq(automationSteps.id, automationStepId))

    return step
  }

  /**
   * Find an automation step by parent ID
   *
   * @param automationStepId - The parent ID to search for
   * @returns The found step or undefined
   */
  async findByParentId(automationStepId: string) {
    const [step] = await this.database
      .select()
      .from(automationSteps)
      .where(eq(automationSteps.parentId, automationStepId))

    return step
  }

  /**
   * Update the configuration of an automation step
   *
   * @param automationStepId - The ID of the step to update
   * @param data - The new configuration data
   * @returns The updated step ID
   */
  async updateConfiguration(automationStepId: string, data: UpdateAutomationStepDto) {
    await this.database.transaction(async (trx) => {
      await trx
        .update(automationSteps)
        .set({
          configuration: data.configuration as AutomationStepConfiguration,
          ...(data.emailId ? { emailId: data.emailId } : {}),
          ...(data.tagId ? { tagId: data.tagId } : {}),
          ...(data.audienceId ? { audienceId: data.audienceId } : {}),
        })
        .where(eq(automationSteps.id, automationStepId))
    })

    return { id: automationStepId }
  }
}
