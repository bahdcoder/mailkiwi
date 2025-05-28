import { appEnv } from '#root/core/app/env/app_env.js'
import type { AlertRootProps } from '@kibamail/owly/alert'
import { setCookie } from 'hono/cookie'

import { FlashMiddleware } from '#root/core/shared/middleware/flash_middleware.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export type FlashMessagePayload = {
  title: string
  description?: string
  variant?: AlertRootProps['variant']
  [key: string]: string | number | boolean | undefined
}

export class FlashController {
  flash(ctx: HonoContext, payload: FlashMessagePayload) {
    setCookie(ctx, FlashMiddleware.FLASH_COOKIE_NAME, JSON.stringify(payload), {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: appEnv.isProd,
    })
  }
}
