import { appEnv } from '#root/core/app/env/app_env.js'
import type { Next } from 'hono'
import { deleteCookie, getCookie, setCookie, setSignedCookie } from 'hono/cookie'

import type { HonoContext } from '#root/core/shared/server/types.js'

export class FlashMiddleware {
  static FLASH_COOKIE_NAME = '__FLASH_MESSAGE'

  handle = async (ctx: HonoContext, next: Next) => {
    const flash = getCookie(ctx, FlashMiddleware.FLASH_COOKIE_NAME)

    if (flash) {
      const message = deleteCookie(ctx, FlashMiddleware.FLASH_COOKIE_NAME)

      if (message) {
        ctx.set('flash', message)
      }
    }

    await next()
  }
}
