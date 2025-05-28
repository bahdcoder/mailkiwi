import { Hono as FrameworkHono } from '@kibamail/framework'

export type { HonoInstance } from '@kibamail/framework'
import type { HttpBindings } from '@hono/node-server'
import * as Sentry from '@sentry/node'
import type { MiddlewareHandler } from 'hono'
import type { HonoOptions } from 'hono/hono-base'

import { EnsureUserAndTeamSessionsMiddleware } from '#root/core/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { UserSessionMiddleware } from '#root/core/auth/middleware/user_session_middleware.js'

import { sentryConfig, isSentryEnabled } from '#root/core/app/env/sentry.js'

import { container } from '@kibamail/framework'
import type { appEnv as env } from '#root/core/app/env/app_env.js'
import type { Logger } from 'pino'

if (isSentryEnabled()) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    tracesSampleRate: sentryConfig.tracesSampleRate,
  })
}

export class Hono extends FrameworkHono {
  constructor(
    protected appEnv: typeof env,
    logger: Logger,
    options?: HonoOptions<{ Bindings: HttpBindings }>,
  ) {
    super(appEnv, logger, options)
  }

  protected defaultMiddleware(): MiddlewareHandler[] {
    return [
      container.resolve(UserSessionMiddleware).handle,
      container.resolve(EnsureUserAndTeamSessionsMiddleware).handle,
    ]
  }

  defineErrorHandler() {
    super.defineErrorHandler((error, ctx) => {
      if (isSentryEnabled()) {
        const user = ctx.get('user')
        const team = ctx.get('team')

        if (user) {
          Sentry.setUser({
            id: user.id,
            email: user.email,
          })
        }

        if (team) {
          Sentry.setTag('team_id', team.id)
          Sentry.setTag('team_name', team.name)
        }

        Sentry.setContext('request', {
          url: ctx.req.url,
          method: ctx.req.method,
          headers: ctx.req.raw.headers,
          requestId: ctx.get('requestId'),
        })

        Sentry.captureException(error)
      }
    })

    return this
  }
}
