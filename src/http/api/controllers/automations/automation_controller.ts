import { CreateAutomationAction } from "@/domains/automations/actions/create_automation_action.js"
import { CreateAutomationSchema } from "@/domains/automations/dto/create_automation_dto.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.js"
import { makeApp } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.js"
import { HonoContext } from "@/infrastructure/server/types.js"
import { container } from "@/utils/typi.js"
import { AudienceValidationAndAuthorizationConcern } from "@/http/api/concerns/audience_validation_concern.ts"
import { CreateAutomationStepDto } from "@/domains/automations/dto/create_automation_step_dto.ts"
import { CreateAutomationStepAction } from "@/domains/automations/actions/create_automation_step_action.ts"

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

    const automation = await action.handle(data, ctx.req.param("audienceId"))

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
