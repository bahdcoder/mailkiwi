import { apiEnv } from "@/api/env/api_env.js"
import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.js"

import { makeApp, makeRedis } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

import { container } from "@/utils/typi.js"

export class DkimController extends BaseController {
  constructor(
    private app = makeApp(),
    private redis = makeRedis(),
  ) {
    super()

    this.app.defineRoutes(
      [["POST", "/mta/dkim/", this.index.bind(this)]],
      {
        prefix: "/",
        middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
      },
    )
  }

  async index(ctx: HonoContext) {
    const { domain } = await ctx.req.json<{ domain: string }>()

    const domainDkim: Record<
      "encryptedDkimPrivateKey" | "returnPathSubDomain" | "dkimSubDomain",
      string
    > = await this.redis.hgetall(`DOMAIN:${domain}`)

    if (!domainDkim.encryptedDkimPrivateKey) {
      return ctx.json({ status: "failed" }, 400)
    }

    const privateKey = new Encryption(apiEnv.APP_KEY).decrypt(
      domainDkim.encryptedDkimPrivateKey,
    )

    const { returnPathSubDomain, dkimSubDomain } = domainDkim

    return ctx.json({
      status: "success",
      returnPathSubDomain,
      dkimSubDomain,
      privateKey: privateKey?.release(),
    })
  }
}
