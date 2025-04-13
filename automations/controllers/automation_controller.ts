import { CreateAutomationAction } from "@/automations/actions/create_automation_action.js"
import { CreateAutomationStepAction } from "@/automations/actions/create_automation_step_action.js"
import { GetAutomationAction } from "@/automations/actions/get_automation_action.js"
import { UpdateAutomationStepAction } from "@/automations/actions/update_automation_step_action.js"
import { CreateAutomationSchema } from "@/automations/dto/create_automation_dto.js"
import { CreateAutomationStepDto } from "@/automations/dto/create_automation_step_dto.js"
import { UpdateAutomationStepDto } from "@/automations/dto/update_automation_step_dto.js"
import { AutomationStepRepository } from "@/automations/repositories/automation_step_repository.js"

import type {
  Audience,
  AutomationStep,
  AutomationWithSteps,
} from "@/database/database_schema_types.js"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class AutomationController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["GET", "/:automationId", this.get.bind(this)],
        ["POST", "/", this.store.bind(this)],
        ["POST", "/:automationId/steps", this.createStep.bind(this)],
        [
          "PATCH",
          "/:automationId/steps/:automationStepId/configuration",
          this.updateAutomationStepConfiguration.bind(this),
        ],
      ],
      {
        prefix: "audiences/:audienceId/automations",
      }
    )
  }

  async get(ctx: HonoContext) {
    const automation = await this.ensureExists<AutomationWithSteps>(
      ctx,
      "automationId"
    )

    return this.response(ctx).json(automation)
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAutomationSchema)

    const action = container.make(CreateAutomationAction)

    const automation = await action.handle(data, ctx.req.param("audienceId"))

    return this.response(ctx).json(automation).send()
  }

  async createStep(ctx: HonoContext) {
    await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const automationId = ctx.req.param("automationId")

    const data = await this.validate(ctx, CreateAutomationStepDto)

    const step = await container
      .resolve(CreateAutomationStepAction)
      .handle(automationId, data)

    return this.response(ctx)
      .json(
        {
          automation: await container
            .make(GetAutomationAction)
            .handle(automationId),
          step: { ...step, ...data },
        },
        201
      )
      .send()
  }

  async updateAutomationStepConfiguration(ctx: HonoContext) {
    await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const automationId = ctx.req.param("automationId")
    const automationStepId = ctx.req.param("automationStepId")

    const stepRepository = container.make(AutomationStepRepository)
    const step = await stepRepository.findById(automationStepId)

    if (!step) {
      throw E_VALIDATION_FAILED([
        {
          message: `Automation step with ID ${automationStepId} not found`,
          field: "automationStepId",
        },
      ])
    }

    const data = await this.validate(ctx, UpdateAutomationStepDto)

    const updatedStep = await container
      .resolve(UpdateAutomationStepAction)
      .handle(step, data)

    return this.response(ctx)
      .json(
        {
          automation: await container
            .make(GetAutomationAction)
            .handle(automationId),
          step: { ...updatedStep, ...data },
        },
        200
      )
      .send()
  }
}
