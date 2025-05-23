import type { Next } from 'hono'

import { E_UNAUTHORIZED } from '#root/core/http/responses/errors.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

/**
 * MustBeAuthenticatedMiddleware enforces user authentication for protected routes.
 *
 * This middleware is a critical security component that ensures routes can only be
 * accessed by authenticated users. It works by:
 *
 * 1. Checking for the presence of a user object in the request context
 * 2. Blocking access with a 401 Unauthorized response if no user is found
 * 3. Allowing the request to proceed if a user is authenticated
 *
 * Unlike some other authentication middleware, this one is strictly blocking -
 * there is no fallback or optional authentication path. This makes it suitable
 * for protecting routes that should never be accessible to unauthenticated users.
 */
export class MustBeAuthenticatedMiddleware {
  /**
   * Processes the request to enforce authentication.
   *
   * @param ctx - The Hono request context
   * @param next - The next middleware function
   * @throws E_UNAUTHORIZED if no authenticated user is found
   */
  handle = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get('user')

    if (!user) throw E_UNAUTHORIZED()

    await next()
  }
}
