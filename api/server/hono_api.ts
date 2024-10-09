import { type MiddlewareHandler } from "hono"

import { TeamMiddleware } from "@/audiences/middleware/team_middleware.js"

import { AccessTokenMiddleware } from "@/auth/middleware/access_token_middleware.js"
import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { Hono } from "@/shared/server/hono.js"

import { container } from "@/utils/typi.js"

export type RouteOptions = {
  middleware?: MiddlewareHandler[]
  prefix?: string
}

export class HonoApi extends Hono {
  protected defaultMiddleware(): MiddlewareHandler[] {
    return [
      container.resolve(UserSessionMiddleware).handle,
      // container.resolve(AccessTokenMiddleware).handle,
      // container.resolve(TeamMiddleware).handle,
    ]
  }
}
