import { type MiddlewareHandler } from "hono"

import { TeamMiddleware } from "@/audiences/middleware/team_middleware.ts"

import { AccessTokenMiddleware } from "@/auth/middleware/access_token_middleware.ts"

import { Hono } from "@/shared/server/hono.ts"

import { container } from "@/utils/typi.js"

export type RouteOptions = {
  middleware?: MiddlewareHandler[]
  prefix?: string
}

export class HonoApi extends Hono {
  protected defaultMiddleware(): MiddlewareHandler[] {
    return [
      container.resolve(AccessTokenMiddleware).handle,
      container.resolve(TeamMiddleware).handle,
    ]
  }
}
