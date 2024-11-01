import { InjectEmailAction } from "@/injector/actions/inject_email_action.js"
import { InjectEmailSchema } from "@/injector/dto/inject_email_dto.js"
import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { getDomainFromEmail } from "@/injector/utils/get_domain_from_email.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class InjectEmailController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([["POST", "/inject", this.index.bind(this)]], {
      middleware: [
        container.make(AuthorizeInjectorApiKeyMiddleware).handle,
      ],
    })
  }

  async index(ctx: HonoContext) {
    const payload = await this.validate(ctx, InjectEmailSchema)

    const sendingDomain = this.ensureCanSendFromDomain(
      ctx,
      getDomainFromEmail(payload.from.email),
    )

    const messages = await container
      .make(InjectEmailAction)
      .handle(payload, sendingDomain)

    return ctx.json({ messages })
  }
}
