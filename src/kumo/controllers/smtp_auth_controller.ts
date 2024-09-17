import { HonoContext } from "@/server/types.ts"

import {
  makeEnv,
  makeMtaHelperApp,
  makeRedis,
} from "@/shared/container/index.ts"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

export class SmtpAuthController extends BaseController {
  constructor(
    private app = makeMtaHelperApp(),
    private redis = makeRedis(),
    private env = makeEnv(),
  ) {
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

    const encryptedApiKey = await this.redis.get(`API_KEY:${username}`)

    if (!encryptedApiKey) {
      return ctx.json({ status: "failed" })
    }

    const apiKey = new Encryption(this.env.APP_KEY).decrypt(
      encryptedApiKey,
    )

    if (apiKey?.release() !== passwd) {
      return ctx.json({ status: "failed" })
    }

    return ctx.json({ status: "success" })
  }
}
