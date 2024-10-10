import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class SmtpAuthController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["POST", "/mta/smtp/auth", this.index.bind(this)]],
      {
        prefix: "/",
        middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
      },
    )
  }

  async index(ctx: HonoContext) {
    const { username, passwd } = await ctx.req.json<{
      username: string
      passwd: string
    }>()

    try {
      await container
        .make(AuthorizeInjectorApiKeyMiddleware)
        .verifySmtpCredentials(username, passwd)

      return ctx.json({ status: "success" })
    } catch (error) {
      return ctx.json({ status: "failed" }, 400)
    }
  }
}
