import type { HttpBindings } from '@hono/node-server'
import * as Sentry from '@sentry/node'
import { Hono as BaseHono, type Handler, type MiddlewareHandler } from 'hono'
import { pinoLogger } from 'hono-pino'
import { compress } from 'hono/compress'
import type { HonoOptions } from 'hono/hono-base'
import { requestId } from 'hono/request-id'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'
import type { HonoContext, HonoRouteDefinition } from './types.js'

import { EnsureUserAndTeamSessionsMiddleware } from '#root/core/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { UserSessionMiddleware } from '#root/core/auth/middleware/user_session_middleware.js'

import { sentryConfig, isSentryEnabled } from '#root/core/app/env/sentry.js'

import { E_REQUEST_EXCEPTION } from '#root/core/http/responses/errors.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'
import { makeLogger } from '#root/core/shared/container/index.js'
import { FlashMiddleware } from '#root/core/shared/middleware/flash_middleware.js'
import { route } from '#root/core/shared/routes/route_aliases.js'

import { container } from '#root/core/utils/typi.js'
import { appEnv } from '#root/core/app/env/app_env'

if (isSentryEnabled()) {
  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    tracesSampleRate: sentryConfig.tracesSampleRate,
  })
}

export type RouteOptions = {
  middleware?: MiddlewareHandler[]
  prefix?: string
}

export type HonoInstance = BaseHono<{
  Bindings: HttpBindings
}> & {
  defineRoutes: (routes: HonoRouteDefinition[], routeOptions?: RouteOptions) => void
}

export class Hono extends BaseHono<{ Bindings: HttpBindings }> implements HonoInstance {
  protected defaultMiddleware(): MiddlewareHandler[] {
    return [
      container.resolve(UserSessionMiddleware).handle,
      container.resolve(EnsureUserAndTeamSessionsMiddleware).handle,
    ]
  }

  constructor(options?: HonoOptions<{ Bindings: HttpBindings }>) {
    super({
      strict: false,
      ...options,
    })

    this.use(
      pinoLogger({
        pino: makeLogger(),
      }),
    )

    this.use(compress())

    this.use('*', requestId())
    this.use('*', container.make(FlashMiddleware).handle)
    this.defineErrorHandler()
  }

  defineErrorHandler() {
    const logger = makeLogger()

    this.onError((error, ctx) => {
      logger.error(error)

      if (appEnv.isDev) {
        d({ error })
      }

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

      const unknownErrorMessage = `We encountered an error trying to process your request. Our team has been notified and we're working on it right now. In the mean time, please try again.`

      const jsonPayload =
        error instanceof E_REQUEST_EXCEPTION
          ? {
              message: error?.message ?? unknownErrorMessage,
              ...(error.payload ?? {}),
            }
          : { message: unknownErrorMessage }

      const controller = container.make(BaseController)
      const requestContext = ctx as unknown as HonoContext

      let redirectToPath = route('auth_login')
      let statusCode: ContentfulStatusCode = 200

      if (error instanceof E_REQUEST_EXCEPTION) {
        statusCode = error?.statusCode
        if (error?.statusCode === 401) {
          redirectToPath = route('auth_login')
        }

        if (error?.statusCode === 500) {
          redirectToPath = route('error_500')
        }

        if (error?.statusCode === 404) {
          redirectToPath = route('error_404')
        }
      } else {
        statusCode = 500
      }

      return controller
        .response(requestContext)
        .redirect(redirectToPath)
        .json(
          jsonPayload,
          statusCode,
          ctx.req.header('Content-Type')?.includes('multipart/form-data'),
        )
        .send()
    })

    return this
  }

  protected getRoutePath(path: string, prefix = '/') {
    return `${prefix?.replace(/^\/|\/$/g, '')}${
      path === '/' ? '' : '/'
    }${path?.replace(/^\/|\/$/g, '')}`
  }

  protected defineRoutesForMiddleware(
    route: HonoRouteDefinition,
    resolvedPath: string,
    middleware: MiddlewareHandler[],
  ) {
    const [method, , handler, additionalMiddleware = []] = route

    const handlerArguments: [string, ...MiddlewareHandler[], Handler] = [
      resolvedPath,
      ...middleware,
      ...additionalMiddleware,
      handler,
    ]

    switch (method) {
      case 'GET':
        this.get(...handlerArguments)
        break
      case 'DELETE':
        this.delete(...handlerArguments)
        break
      case 'PATCH':
        this.patch(...handlerArguments)
        break
      case 'PUT':
        this.put(...handlerArguments)
        break
      case 'POST':
        this.post(...handlerArguments)
        break
      default:
        break
    }
  }

  defineRoutes(
    routes: HonoRouteDefinition[],
    routeOptions?: {
      middleware?: MiddlewareHandler[]
      prefix?: string
    },
  ) {
    const middleware: MiddlewareHandler[] =
      routeOptions?.middleware ?? this.defaultMiddleware()

    for (const route of routes) {
      const [, path] = route
      const resolvedPath = this.getRoutePath(path, routeOptions?.prefix)

      this.defineRoutesForMiddleware(route, resolvedPath, middleware)
    }
  }
}
