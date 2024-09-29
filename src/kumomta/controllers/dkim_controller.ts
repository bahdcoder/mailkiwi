import { apiEnv } from "@/api/env/api_env.js"
import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

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

    const sendingSource = await container
      .make(SendingDomainRepository)
      .getDomainWithDkim(domain)

    if (!sendingSource) return ctx.json({ status: "failed" })

    const { domain: domainDkim, send, engage } = sendingSource

    const privateKey = new Encryption(apiEnv.APP_KEY).decrypt(
      domainDkim.dkimPrivateKey,
    )

    const { returnPathSubDomain, dkimSubDomain } = domainDkim

    return ctx.json({
      status: "success",
      returnPathSubDomain,
      dkimSubDomain,
      privateKey: privateKey?.release(),
      send,
      engage,
    })
  }
}
