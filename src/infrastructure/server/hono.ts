import { Env, Hono as BaseHono, MiddlewareHandler } from "hono"
import { HonoOptions } from "hono/hono-base"

import { TeamMiddleware } from "@/http/api/middleware/audiences/team_middleware.js"
import { AccessTokenMiddleware } from "@/http/api/middleware/auth/access_token_middleware.js"
import { E_REQUEST_EXCEPTION } from "@/http/responses/errors.js"
import { container } from "@/utils/typi.js"

import { HonoRouteDefinition } from "./types.js"

export type HonoInstance<E extends Env = object> = BaseHono<E> & {
  defineRoutes: (
    routes: HonoRouteDefinition[],
    routeOptions?: { middleware?: MiddlewareHandler[]; prefix?: string },
  ) => void
}

export class Hono<E extends Env>
  extends BaseHono<E>
  implements HonoInstance<E>
{
  constructor(options?: HonoOptions<E>) {
    super(options)
  }

  defineErrorHandler() {
    this.onError((error, ctx) => {
      if (error instanceof E_REQUEST_EXCEPTION) {
        return ctx.json(
          { message: error?.message, ...(error.payload ?? {}) },
          error?.statusCode ?? 500,
        )
      }

      return ctx.json({ message: error?.message }, 500)
    })

    return this
  }

  defineRoutes(
    routes: HonoRouteDefinition[],
    routeOptions?: { middleware?: MiddlewareHandler[]; prefix?: string },
  ) {
    const middleware: MiddlewareHandler[] = routeOptions?.middleware ?? [
      container.resolve(AccessTokenMiddleware).handle,
      container.resolve(TeamMiddleware).handle,
    ]

    const getPath = (path: string) => {
      return `${routeOptions?.prefix?.replace(/^\/|\/$/g, "")}${path === "/" ? "" : "/"}${path?.replace(/^\/|\/$/g, "")}`
    }

    for (const [method, path, handler] of routes) {
      const resolvedPath = getPath(path)

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
  }
}
