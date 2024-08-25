import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.ts"
import { CreateSendingDomainSchema } from "@/sending_domains/dto/create_sending_domain_dto.ts"

import type { HonoContext } from "@/server/types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

import { container } from "@/utils/typi.ts"

export class SendingDomainController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([["POST", "/", this.store.bind(this)]], {
      prefix: "sending_domains",
    })
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateSendingDomainSchema)

    const team = this.ensureTeam(ctx)

    const sendingDomain = await container
      .make(CreateSendingDomainAction)
      .handle(data, team.id)

    return ctx.json(sendingDomain)
  }
}
