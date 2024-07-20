import { container, inject, injectable } from "tsyringe"

import { CreateAutomationAction } from "@/domains/automations/actions/create_automation_action.js"
import { CreateAutomationSchema } from "@/domains/automations/dto/create_automation_dto.js"
import { AutomationRepository } from "@/domains/automations/repositories/automation_repository.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class AutomationController extends BaseController {
  constructor(
    @inject(AutomationRepository)
    private AutomationRepository: AutomationRepository,
    @inject(ContainerKey.app) private app: HonoInstance,
  ) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
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

    const action = container.resolve<CreateAutomationAction>(
      CreateAutomationAction,
    )

    const automation = await action.handle(data, ctx.req.param("audienceId"))

    return ctx.json(automation)
  }
}
