import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"
import { container, inject, injectable } from "tsyringe"

import { CreateAutomationAction } from "@/domains/automations/actions/create_automation_action.js"
import { CreateAutomationSchema } from "@/domains/automations/dto/create_automation_dto.js"
import { AutomationRepository } from "@/domains/automations/repositories/automation_repository.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.ts"
import { ContainerKey } from "@/infrastructure/container.js"

@injectable()
export class AutomationController extends BaseController {
  constructor(
    @inject(AutomationRepository)
    private AutomationRepository: AutomationRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this) as RouteHandlerMethod],
      ],
      {
        prefix: "audiences/:audienceId/automations",
      },
    )
  }

  async index(request: FastifyRequest, response: FastifyReply) {
    return response.send([])
  }

  async store(
    request: FastifyRequest<{ Params: { audienceId: string } }>,
    _: FastifyReply,
  ) {
    const data = this.validate(request, CreateAutomationSchema)

    const action = container.resolve<CreateAutomationAction>(
      CreateAutomationAction,
    )

    const automation = await action.handle(data, request.params.audienceId)

    return automation
  }
}
