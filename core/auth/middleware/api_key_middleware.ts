import type { Next } from 'hono'

import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * ApiKeyMiddleware handles optional API key authentication for requests.
 *
 * This middleware is part of Kibamail's API authentication system, responsible for:
 * 1. Extracting API keys from the Authorization header
 * 2. Validating API keys against the database
 * 3. Loading the associated access token information
 * 4. Making the access token available to downstream middleware and controllers
 *
 * Unlike the AccessTokenMiddleware, this middleware is non-blocking - requests without
 * a valid API key are allowed to continue through the middleware chain. This enables
 * the middleware to be used on routes that support both session-based and API key
 * authentication methods.
 *
 * This approach is commonly used for routes that need to support both browser-based
 * access (using session cookies) and programmatic API access (using API keys).
 */
export class ApiKeyMiddleware {
  constructor(private accessTokenRepository = container.make(AccessTokenRepository)) {}

  /**
   * Processes the request to extract and validate an API key.
   *
   * This method implements the optional API key authentication logic:
   * 1. Extracts the API key from the Authorization header (Bearer token format)
   * 2. If no API key is present, allows the request to continue
   * 3. Validates the API key against the database
   * 4. If the API key is invalid, allows the request to continue
   * 5. Makes the access token available to downstream handlers via context
   *
   * The non-blocking nature of this middleware allows it to be combined with
   * session-based authentication middleware, enabling routes to support multiple
   * authentication methods simultaneously.
   *
   * @param ctx - The Hono request context
   * @param next - The next middleware function
   * @returns The result of the next middleware
   */
  handle = async (ctx: HonoContext, next: Next) => {
    const authorization = ctx.req.header('Authorization')
    const [apiKey] = authorization?.split('Bearer ') ?? []

    if (!apiKey) {
      return next()
    }

    const accessToken = await this.accessTokenRepository.check(apiKey)

    if (!accessToken) {
      return next()
    }

    ctx.set('accessToken', accessToken)

    await next()
  }
}
