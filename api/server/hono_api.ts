import { type MiddlewareHandler } from "hono"

import { EnsureUserAndTeamSessionsMiddleware } from "@/auth/middleware/ensure_user_and_team_sessions_middleware.js"
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
      container.resolve(EnsureUserAndTeamSessionsMiddleware).handle,
    ]
  }
}
