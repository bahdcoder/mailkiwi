import { mtaAuthenticatorEnv } from "@/kumomta/env/mta_authenticator_env.ts"

import {
  makeMtaAuthenticatorApp,
  makeRedis,
} from "@/shared/container/index.ts"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

export class DkimController extends BaseController {
  constructor(
    private app = makeMtaAuthenticatorApp(),
    private redis = makeRedis(),
  ) {
    super()

    this.app.defineRoutes([["POST", "/dkim/", this.index.bind(this)]], {
      prefix: "/",
    })
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

    const privateKey = new Encryption(mtaAuthenticatorEnv.APP_KEY).decrypt(
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
