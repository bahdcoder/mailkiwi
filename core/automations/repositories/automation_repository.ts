import { eq } from 'drizzle-orm'

import type { CreateAutomationDto } from '#root/core/automations/dto/create_automation_dto.js'

import type { DrizzleClient } from '#root/database/client.js'
import { automationSteps, automations } from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { automationStepSubtypesTriggerMap } from '#root/database/types/automations.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

/**
 * AutomationRepository handles database operations for automation workflows.
 *
 * This repository is responsible for managing the persistence of automation workflows,
 * including creating, retrieving, and updating automations and their steps. It implements
 * the core data access patterns for the automation system, which enables features like:
 *
 * - Creating automation workflows with proper structure
 * - Loading automations with their complete step hierarchy
 * - Updating automation configurations and metadata
 *
 * The repository uses a transaction-based approach for operations that modify multiple
 * related records, ensuring data consistency even in case of failures.
 */
export class AutomationRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  /**
   * Relationship between automations and their steps.
   *
   * This relationship enables efficient loading of an automation with all its steps
   * in a single query. The steps represent the nodes in the automation workflow graph,
   * with each step having a specific type (trigger, action, rule, end) and configuration.
   *
   * The relationship is used when retrieving automations to ensure that all steps
   * are loaded together, allowing the frontend to render the complete workflow
   * without additional queries.
   */
  private hasManySteps() {
    return hasMany(this.database, {
      from: automations,
      to: automationSteps,
      primaryKey: automations.id,
      foreignKey: automationSteps.automationId,
      relationName: 'steps',
    })
  }

  /**
   * Retrieves an automation with all its steps by ID.
   *
   * This method loads a complete automation workflow, including all its steps,
   * in a single efficient query. The steps are loaded as a nested array property
   * of the automation, preserving the relationship structure.
   *
   * This comprehensive data is essential for rendering the automation workflow
   * in the UI, as it provides all the information needed to display the complete
   * workflow graph with its nodes (steps) and connections.
   *
   * @param automationId - The unique identifier of the automation to retrieve
   * @returns The automation with all its steps, or undefined if not found
   */
  async findById(automationId: string) {
    const [automation] = await this.hasManySteps()((query) =>
      query.where(eq(automations.id, automationId)),
    )

    return automation
  }

  /**
   * Creates a new automation workflow with initial trigger and end steps.
   *
   * This method implements the automation creation process, which includes:
   * 1. Creating the automation record with basic metadata
   * 2. Adding an initial trigger step that determines when contacts enter the automation
   * 3. Adding an end step that marks the completion of the automation flow
   *
   * The method uses a database transaction to ensure that all records are created
   * atomically - either all succeed or all fail. This prevents partial automation
   * creation that could leave the system in an inconsistent state.
   *
   * The initial structure with trigger and end steps provides the foundation for
   * building the automation workflow, with additional steps added between them
   * to create the complete customer journey.
   *
   * @param payload - The automation metadata from the creation request
   * @param audienceId - The ID of the audience this automation belongs to
   * @returns Object containing the IDs of the created automation and its initial steps
   */
  async create(payload: CreateAutomationDto, audienceId: string) {
    // Generate unique IDs for the automation and its initial steps
    const id = this.cuid()
    const triggerStepId = this.cuid()
    const endStepId = this.cuid()

    // Use a transaction to ensure all records are created atomically
    await this.database.transaction(async (trx) => {
      // Create the automation record with basic metadata
      await trx.insert(automations).values({ id, ...payload, audienceId })

      // Add the initial trigger step
      // This step determines when contacts enter the automation
      await trx.insert(automationSteps).values({
        id: triggerStepId,
        type: 'TRIGGER',
        automationId: id,
        subtype: automationStepSubtypesTriggerMap.TRIGGER_EMPTY,
        configuration: {
          filterGroups: {
            type: 'AND',
            groups: [],
          },
          tagIds: [],
        },
      })

      // Add the end step
      // This step marks the completion of the automation flow
      await trx.insert(automationSteps).values({
        id: endStepId,
        type: 'TRIGGER',
        automationId: id,
        subtype: 'END',
        configuration: {},
        status: 'ACTIVE',
        parentId: triggerStepId, // Connect the end step to the trigger step
      })
    })

    // Return the IDs of the created automation and its initial steps
    return { id, endStepId, triggerStepId }
  }

  async update(payload: CreateAutomationDto, automationId: string) {
    await this.database
      .update(automations)
      .set(payload)
      .where(eq(automations.id, automationId))

    return { id: automationId }
  }
}
