import type { Next } from "hono"

import type { HonoContext } from "@/server/types.js"

import { makeEnv } from "@/shared/container/index.ts"

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
