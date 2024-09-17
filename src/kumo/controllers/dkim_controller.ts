import { HonoContext } from "@/server/types.ts"

import {
  makeEnv,
  makeMtaHelperApp,
  makeRedis,
} from "@/shared/container/index.ts"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

export class DkimController extends BaseController {
  constructor(
    private app = makeMtaHelperApp(),
    private redis = makeRedis(),
    private env = makeEnv(),
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
      return ctx.json({ status: "failed" })
    }

    const privateKey = new Encryption(this.env.APP_KEY).decrypt(
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
