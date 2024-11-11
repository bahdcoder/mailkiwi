import type { HonoRouteDefinition } from "./types.js"
import type { HttpBindings } from "@hono/node-server"
import { Hono as BaseHono, type MiddlewareHandler } from "hono"
import { pinoLogger } from "hono-pino"
import { HonoOptions } from "hono/hono-base"
import { logger } from "hono/logger"
import { requestId } from "hono/request-id"

import { EnsureUserAndTeamSessionsMiddleware } from "@/auth/middleware/ensure_user_and_team_sessions_middleware.js"
import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { E_REQUEST_EXCEPTION } from "@/http/responses/errors.js"

import { makeLogger } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export type RouteOptions = {
  middleware?: MiddlewareHandler[]
  prefix?: string
}

export type HonoInstance = BaseHono<{
  Bindings: HttpBindings
}> & {
  defineRoutes: (
    routes: HonoRouteDefinition[],
    routeOptions?: RouteOptions,
  ) => void
}

export class Hono
  extends BaseHono<{ Bindings: HttpBindings }>
  implements HonoInstance
{
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

    this.use("*", requestId())
    this.defineErrorHandler()
  }

  defineErrorHandler() {
    const logger = makeLogger()

    this.onError((error, ctx) => {
      logger.error(error)
      if (error instanceof E_REQUEST_EXCEPTION) {
        return ctx.json(
          {
            message: error?.message,
            ...(error.payload ?? {}),
          },
          error?.statusCode ?? 500,
        )
      }

      return ctx.json({ message: error?.message }, 500)
    })

    return this
  }

  protected getRoutePath(path: string, prefix = "/") {
    return `${prefix?.replace(/^\/|\/$/g, "")}${path === "/" ? "" : "/"}${path?.replace(/^\/|\/$/g, "")}`
  }

  protected defineRoutesForMiddleware(
    route: HonoRouteDefinition,
    resolvedPath: string,
    middleware: MiddlewareHandler[],
  ) {
    const [method, , handler] = route

    switch (method) {
      case "GET":
        this.get(resolvedPath, ...middleware, handler)
        break
      case "DELETE":
        this.delete(resolvedPath, ...middleware, handler)
        break
      case "PATCH":
        this.patch(resolvedPath, ...middleware, handler)
        break
      case "PUT":
        this.put(resolvedPath, ...middleware, handler)
        break
      case "POST":
        this.post(resolvedPath, ...middleware, handler)
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
