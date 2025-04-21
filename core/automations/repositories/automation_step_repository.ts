import { eq } from 'drizzle-orm'

import type { DrizzleClient } from '@/database/client.js'
import { type AutomationStepConfiguration, automationSteps } from '@/database/schema.js'

import type { CreateAutomationStepDto } from '@/automations/dto/create_automation_step_dto.js'
import type { UpdateAutomationStepDto } from '@/automations/dto/update_automation_step_dto.js'
import { AutomationStep } from '@/database/database_schema_types.js'
import { makeDatabase } from '@/shared/container/index.js'
import { BaseRepository } from '@/shared/repositories/base_repository.js'

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
    // Generate IDs for all the steps we'll create
    const ifElseStepId = this.cuid()
    const yesBranchStepId = this.cuid()
    const noBranchStepId = this.cuid()
    const noEndStepId = this.cuid()

    await this.database.transaction(async (trx) => {
      // 1. Create the IF/ELSE rule step
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

      // 2. Create the YES branch step (action) that connects to the target
      await trx.insert(automationSteps).values({
        id: yesBranchStepId,
        automationId,
        type: 'ACTION',
        subtype: 'ACTION_EMPTY', // Default action type, can be changed by user later
        parentId: ifElseStepId,
        branchIndex: 1, // yes branch
        configuration: {} as AutomationStepConfiguration,
      })

      // 3. Update the target step to have the YES branch step as its parent
      await trx
        .update(automationSteps)
        .set({ parentId: yesBranchStepId })
        .where(eq(automationSteps.id, targetId))

      // 4. Create the NO branch step (action)
      await trx.insert(automationSteps).values({
        id: noBranchStepId,
        automationId,
        type: 'ACTION',
        subtype: 'ACTION_SEND_EMAIL', // Default action type, can be changed by user later
        parentId: ifElseStepId,
        branchIndex: 0, // no branch
        configuration: {} as AutomationStepConfiguration,
      })

      // 5. Create an END step for the NO branch
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
      yesBranchStepId,
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
