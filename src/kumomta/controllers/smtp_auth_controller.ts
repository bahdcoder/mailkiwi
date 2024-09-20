import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.ts"

import { makeMtaAuthenticatorApp } from "@/shared/container/index.ts"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.ts"

export class SmtpAuthController extends BaseController {
  constructor(private app = makeMtaAuthenticatorApp()) {
    super()

    this.app.defineRoutes(
      [["POST", "/smtp/auth", this.index.bind(this)]],
      {
        prefix: "/",
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
