import { CreateAutomationAction } from '#root/core/automations/actions/create_automation_action.js'
import { CreateAutomationStepAction } from '#root/core/automations/actions/create_automation_step_action.js'
import { GetAutomationAction } from '#root/core/automations/actions/get_automation_action.js'
import { UpdateAutomationStepAction } from '#root/core/automations/actions/update_automation_step_action.js'
import { CreateAutomationSchema } from '#root/core/automations/dto/create_automation_dto.js'
import { CreateAutomationStepDto } from '#root/core/automations/dto/create_automation_step_dto.js'
import { UpdateAutomationStepDto } from '#root/core/automations/dto/update_automation_step_dto.js'
import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'

import type {
  Audience,
  AutomationStep,
  AutomationWithSteps,
} from '#root/database/database_schema_types.js'
import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoInstance } from '#root/core/shared/server/hono.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * AutomationController handles API endpoints for managing automation workflows.
 *
 * This controller is responsible for the core automation functionality in Kibamail,
 * providing endpoints to create and manage marketing automation workflows. These
 * automations enable sophisticated customer journeys such as:
 *
 * - Welcome sequences for new subscribers
 * - Re-engagement campaigns for inactive contacts
 * - Drip campaigns for nurturing leads
 * - Behavior-triggered emails based on user actions
 *
 * The controller enforces proper authorization and validation for all automation
 * operations, ensuring that users can only manage automations within audiences
 * they have access to.
 */
export class AutomationController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    // Define routes for automation management
    // All routes are scoped to a specific audience via the prefix
    this.app.defineRoutes(
      [
        // List all automations for an audience
        ['GET', '/', this.index.bind(this)],
        // Get a specific automation with its steps
        ['GET', '/:automationId', this.get.bind(this)],
        // Create a new automation
        ['POST', '/', this.store.bind(this)],
        // Add a step to an existing automation
        ['POST', '/:automationId/steps', this.createStep.bind(this)],
        // Update the configuration of an automation step
        [
          'PATCH',
          '/:automationId/steps/:automationStepId/configuration',
          this.updateAutomationStepConfiguration.bind(this),
        ],
      ],
      {
        // All automation routes are scoped to a specific audience
        // This enforces proper data isolation in the multi-tenant system
        prefix: 'audiences/:audienceId/automations',
      },
    )
  }

  async get(ctx: HonoContext) {
    const automation = await this.ensureExists<AutomationWithSteps>(ctx, 'automationId')

    return this.response(ctx).json(automation)
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  /**
   * Creates a new automation workflow for an audience.
   *
   * This method implements the automation creation process:
   * 1. Validates the request data against the schema
   * 2. Creates a new automation with initial trigger and end steps
   * 3. Returns the created automation details
   *
   * When a new automation is created, the system automatically adds two steps:
   * - A trigger step that determines when contacts enter the automation
   * - An end step that marks the completion of the automation flow
   *
   * These initial steps provide the foundation for building the automation workflow,
   * with additional steps added between them to create the complete customer journey.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the created automation details
   */
  async store(ctx: HonoContext) {
    // Validate the request data against the schema
    const data = await this.validate(ctx, CreateAutomationSchema)

    // Create the automation using the action pattern
    const action = container.make(CreateAutomationAction)
    const automation = await action.handle(data, ctx.req.param('audienceId'))

    // Return the created automation details
    return this.response(ctx).json(automation).send()
  }

  /**
   * Adds a new step to an existing automation workflow.
   *
   * This method implements the process of adding steps to an automation:
   * 1. Verifies the audience exists and the user has author permissions
   * 2. Validates the step configuration against the schema
   * 3. Creates the new step and connects it to the automation
   * 4. Returns the updated automation with the new step
   *
   * Steps are the building blocks of automation workflows, with different types:
   * - Triggers: Determine when contacts enter the automation
   * - Actions: Perform operations like sending emails or adding tags
   * - Rules: Implement conditional logic and timing controls
   * - End: Mark the completion of an automation path
   *
   * The step configuration varies based on the step type, with each type having
   * specific configuration options validated by the schema.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the updated automation and new step
   */
  async createStep(ctx: HonoContext) {
    // Verify the audience exists
    await this.ensureExists<Audience>(ctx, 'audienceId')

    // Verify the user has author permissions
    this.ensureCanAuthor(ctx)

    // Get the automation ID from the URL parameters
    const automationId = ctx.req.param('automationId')

    // Validate the step configuration against the schema
    const data = await this.validate(ctx, CreateAutomationStepDto)

    // Create the new step using the action pattern
    const step = await container
      .resolve(CreateAutomationStepAction)
      .handle(automationId, data)

    // Return the updated automation with the new step
    return this.response(ctx)
      .json(
        {
          automation: await container.make(GetAutomationAction).handle(automationId),
          step: { ...step, ...data },
        },
        201,
      )
      .send()
  }

  /**
   * Updates the configuration of an existing automation step.
   *
   * This method implements the process of modifying step configurations:
   * 1. Verifies the audience exists and the user has author permissions
   * 2. Retrieves the existing step and validates it exists
   * 3. Validates the updated configuration against the schema
   * 4. Updates the step configuration
   * 5. Returns the updated automation with the modified step
   *
   * Step configuration updates are essential for refining automation workflows,
   * allowing users to adjust conditions, timing, content, and other parameters
   * without rebuilding the entire automation. Common updates include:
   *
   * - Modifying email content in send email steps
   * - Adjusting wait times in delay steps
   * - Refining conditions in if/else steps
   * - Changing tags in tag management steps
   *
   * The validation ensures that the updated configuration remains valid for the
   * specific step type, preventing inconsistent or invalid automation states.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the updated automation and modified step
   * @throws E_VALIDATION_FAILED if the step doesn't exist
   */
  async updateAutomationStepConfiguration(ctx: HonoContext) {
    // Verify the audience exists
    await this.ensureExists<Audience>(ctx, 'audienceId')

    // Verify the user has author permissions
    this.ensureCanAuthor(ctx)

    // Get the automation and step IDs from the URL parameters
    const automationId = ctx.req.param('automationId')
    const automationStepId = ctx.req.param('automationStepId')

    // Retrieve the existing step
    const stepRepository = container.make(AutomationStepRepository)
    const step = await stepRepository.findById(automationStepId)

    // Validate that the step exists
    if (!step) {
      throw E_VALIDATION_FAILED([
        {
          message: `Automation step with ID ${automationStepId} not found`,
          field: 'automationStepId',
        },
      ])
    }

    // Validate the updated configuration against the schema
    const data = await this.validate(ctx, UpdateAutomationStepDto)

    // Update the step configuration using the action pattern
    const updatedStep = await container
      .resolve(UpdateAutomationStepAction)
      .handle(step, data)

    // Return the updated automation with the modified step
    return this.response(ctx)
      .json(
        {
          automation: await container.make(GetAutomationAction).handle(automationId),
          step: { ...updatedStep, ...data },
        },
        200,
      )
      .send()
  }
}
