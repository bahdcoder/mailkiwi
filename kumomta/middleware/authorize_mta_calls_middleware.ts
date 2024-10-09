import { apiEnv } from "@/api/env/api_env.js"
import type { Next } from "hono"

import type { HonoContext } from "@/shared/server/types.js"

export class AuthorizeMtaCallsMiddleware {
  handle = async (ctx: HonoContext, next: Next) => {
    const mtaAccessToken = ctx.req.header("x-mta-access-token")

    if (apiEnv.MTA_ACCESS_TOKEN.release() !== mtaAccessToken) {
      return ctx.json({ status: "failed" })
    }

    await next()
  }
}
