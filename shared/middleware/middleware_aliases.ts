import type { MiddlewareHandler } from 'hono'

import { MustBeAuthenticatedMiddleware } from '@/auth/middleware/must_be_authenticated_middleware.js'
import { UserSessionMiddleware } from '@/auth/middleware/user_session_middleware.js'

import { container } from '@/utils/typi.js'

const aliases = () =>
  ({
    must_be_authenticated: container.make(MustBeAuthenticatedMiddleware).handle,
    user_session: container.make(UserSessionMiddleware).handle,
  }) as const

export function middleware(alias: keyof ReturnType<typeof aliases>): MiddlewareHandler {
  return aliases()[alias]
}
