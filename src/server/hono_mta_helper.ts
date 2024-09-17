import { AuthorizeMtaCallsMiddleware } from "@/kumo/middleware/authorize_mta_calls_middleware.ts"
import { type MiddlewareHandler } from "hono"

import { Hono } from "@/server/hono.ts"
import { HonoRouteDefinition } from "@/server/types.ts"

import { container } from "@/utils/typi.ts"

export class HonoMta extends Hono {
  defineRoutes(
    routes: HonoRouteDefinition[],
    routeOptions?: {
      middleware?: MiddlewareHandler[]
      prefix?: string
    },
  ) {
    const middleware: MiddlewareHandler[] = routeOptions?.middleware ?? [
      container.make(AuthorizeMtaCallsMiddleware).handle,
    ]

    for (const route of routes) {
      const [, path] = route
      const resolvedPath = this.getRoutePath(path, routeOptions?.prefix)

      this.defineRoutesForMiddleware(route, resolvedPath, middleware)
    }
  }
}
