import type { Next } from "hono"

import { makeEnv } from "@/shared/container/index.ts"
import type { HonoContext } from "@/shared/server/types.js"

export class AuthorizeMtaCallsMiddleware {
  constructor(private env = makeEnv()) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const mtaAccessToken = ctx.req.header("x-mta-access-token")

    if (this.env.MTA_ACCESS_TOKEN.release() !== mtaAccessToken) {
      return ctx.json({ status: "failed" })
    }

    await next()
  }
}
