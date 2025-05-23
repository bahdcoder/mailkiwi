import type { Next } from 'hono'

import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { E_UNAUTHORIZED } from '#root/core/http/responses/errors.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * AccessTokenMiddleware enforces API key authentication for protected API routes.
 *
 * This middleware is a critical component of Kibamail's API authentication system, responsible for:
 * 1. Extracting and validating API keys from the Authorization header
 * 2. Loading the associated user account
 * 3. Making the user and access token available to downstream middleware and controllers
 * 4. Blocking unauthorized requests with appropriate error responses
 *
 * Unlike the ApiKeyMiddleware, this middleware is blocking - requests without a valid API key
 * are rejected with a 401 Unauthorized response. This makes it suitable for protecting
 * API routes that should only be accessible via API keys.
 *
 * This middleware is typically used for programmatic API endpoints that don't support
 * session-based authentication and require explicit API key authorization.
 */
export class AccessTokenMiddleware {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private userRepository = container.make(UserRepository),
  ) {}

  /**
   * Processes the request to enforce API key authentication.
   *
   * This method implements the strict API key authentication logic:
   * 1. Extracts the API key from the Authorization header (Bearer token format)
   * 2. Rejects the request if no API key is present
   * 3. Validates the API key against the database
   * 4. Rejects the request if the API key is invalid
   * 5. Loads the associated user account
   * 6. Rejects the request if the user account is not found
   * 7. Makes the user and access token available to downstream handlers via context
   *
   * The blocking nature of this middleware ensures that protected API routes
   * can only be accessed with valid API keys, providing strong security for
   * sensitive operations.
   *
   * @param ctx - The Hono request context
   * @param next - The next middleware function
   * @returns The result of the next middleware
   * @throws E_UNAUTHORIZED if authentication fails at any step
   */
  handle = async (ctx: HonoContext, next: Next) => {
    const authorization = ctx.req.header('Authorization')
    const [apiKey] = authorization?.split('Bearer ') ?? []

    if (!apiKey) {
      throw E_UNAUTHORIZED()
    }

    const accessToken = await this.accessTokenRepository.check(apiKey)

    if (!accessToken) {
      throw E_UNAUTHORIZED()
    }

    const user = await this.userRepository.findById(accessToken.userId as string)

    if (!user) {
      throw E_UNAUTHORIZED()
    }

    ctx.set('accessToken', accessToken)
    ctx.set('user', user)

    await next()
  }
}
