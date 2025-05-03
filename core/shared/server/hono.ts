import type { HttpBindings } from '@hono/node-server'
import { Hono as BaseHono, type Handler, type MiddlewareHandler } from 'hono'
import { pinoLogger } from 'hono-pino'
import { compress } from 'hono/compress'
import type { HonoOptions } from 'hono/hono-base'
import { requestId } from 'hono/request-id'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { HonoContext, HonoRouteDefinition } from './types.js'

import { EnsureUserAndTeamSessionsMiddleware } from '@/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { UserSessionMiddleware } from '@/auth/middleware/user_session_middleware.js'

import { E_REQUEST_EXCEPTION } from '@/http/responses/errors.js'

import { makeLogger } from '@/shared/container/index.js'
import { VikeController } from '@/shared/controllers/vike_controller.js'
import { FlashMiddleware } from '@/shared/middleware/flash_middleware.js'
import { middleware } from '@/shared/middleware/middleware_aliases.js'
import { route } from '@/shared/routes/route_aliases.js'

import { container } from '@/utils/typi.js'

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

      const unknownErrorMessage = `We encountered an error trying to process your request. Our team has been notified and we're working on it right now. In the mean time, please try again.`

      const jsonPayload =
        error instanceof E_REQUEST_EXCEPTION
          ? {
              message: error?.message ?? unknownErrorMessage,
              ...(error.payload ?? {}),
            }
          : { message: unknownErrorMessage }

      const controller = container.make(VikeController)
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
