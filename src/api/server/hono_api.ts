import type { HttpBindings } from "@hono/node-server"
import { Hono as BaseHono, type MiddlewareHandler } from "hono"

import { TeamMiddleware } from "@/audiences/middleware/team_middleware.ts"

import { AccessTokenMiddleware } from "@/auth/middleware/access_token_middleware.ts"

import { E_REQUEST_EXCEPTION } from "@/http/responses/errors.js"

import { env } from "@/shared/env/index.js"
import { Hono } from "@/shared/server/hono.ts"
import type { HonoRouteDefinition } from "@/shared/server/types.js"

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

export class HonoApi extends Hono {
  protected defaultMiddleware: MiddlewareHandler[] = [
    container.resolve(AccessTokenMiddleware).handle,
    container.resolve(TeamMiddleware).handle,
  ]

  constructor() {
    super()

    this.defineErrorHandler()
  }

  defineErrorHandler() {
    this.onError((error, ctx) => {
      if (error instanceof E_REQUEST_EXCEPTION) {
        return ctx.json(
          {
            message: error?.message,
            ...(error.payload ?? {}),
          },
          error?.statusCode ?? 500,
        )
      }

      if (env.isDev) {
        d({ error })
      }

      return ctx.json({ message: error?.message }, 500)
    })

    return this
  }
}
