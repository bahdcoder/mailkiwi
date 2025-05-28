import { appEnv } from '#root/core/app/env/app_env.js'
import type { Next } from 'hono'

import type { HonoContext } from '#root/core/shared/server/types.js'

export class AuthorizeMtaCallsMiddleware {
  handle = async (ctx: HonoContext, next: Next) => {
    const mtaAccessToken = ctx.req.header('x-mta-access-token')

    if (appEnv.MTA_ACCESS_TOKEN.release() !== mtaAccessToken) {
      return ctx.json({ status: 'failed' })
    }

    await next()
  }
}
