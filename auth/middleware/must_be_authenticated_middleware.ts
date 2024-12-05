import type { Next } from "hono"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import type { HonoContext } from "@/shared/server/types.js"

export class MustBeAuthenticatedMiddleware {
  handle = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get("user")

    if (!user) throw E_UNAUTHORIZED()

    await next()
  }
}
