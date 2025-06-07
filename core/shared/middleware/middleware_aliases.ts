import type { MiddlewareHandler } from 'hono'

import { MustBeAuthenticatedMiddleware } from '#root/core/auth/middleware/must_be_authenticated_middleware.js'
import { UserSessionMiddleware } from '#root/core/auth/middleware/user_session_middleware.js'

import { container } from '#root/core/utils/typi.js'
import { ApiKeyMiddleware } from '#root/core/auth/middleware/api_key_middleware'
import { AccessTokenMiddleware } from '#root/core/auth/middleware/access_token_middleware'
import { AuthorizeSendingDomainMiddleware } from '#root/core/injector/middleware/authorize_sending_domain_middleware'
import { TeamMiddleware } from '#root/core/audiences/middleware/team_middleware'

const aliases = () =>
  ({
    must_be_authenticated: container.make(MustBeAuthenticatedMiddleware).handle,
    user_session: container.make(UserSessionMiddleware).handle,
    api_key: container.make(ApiKeyMiddleware).handle,
    access_token: container.make(AccessTokenMiddleware).handle,
    authorize_sending_domain: container.make(AuthorizeSendingDomainMiddleware).handle,
    team: container.make(TeamMiddleware).handle,
  }) as const

export function middleware(alias: keyof ReturnType<typeof aliases>): MiddlewareHandler {
  return aliases()[alias]
}
