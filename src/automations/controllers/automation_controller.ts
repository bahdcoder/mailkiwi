import { AudienceValidationAndAuthorizationConcern } from "@/audiences/concerns/audience_validation_concern.js"

import { CreateAutomationAction } from "@/automations/actions/create_automation_action.js"
import { CreateAutomationStepAction } from "@/automations/actions/create_automation_step_action.js"
import { CreateAutomationSchema } from "@/automations/dto/create_automation_dto.js"
import { CreateAutomationStepDto } from "@/automations/dto/create_automation_step_dto.js"

import type { HonoInstance } from "@/server/hono.js"
import type { HonoContext } from "@/server/types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

import { container } from "@/utils/typi.js"

export class AutomationController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),

    private audienceValidationAndAuthorizationConcern: AudienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
        ["POST", "/:automationId/steps", this.createStep.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/automations",
      },
    )
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAutomationSchema)

    const action = container.make(CreateAutomationAction)

    const automation = await action.handle(
      data,
      ctx.req.param("audienceId"),
    )

    return ctx.json(automation)
  }

  async createStep(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const automationId = ctx.req.param("automationId")

    const data = await this.validate(ctx, CreateAutomationStepDto)

    const step = await container
      .resolve(CreateAutomationStepAction)
      .handle(automationId, data)

    return ctx.json(step, 201)
  }
}
