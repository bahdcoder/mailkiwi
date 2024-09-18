import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.ts"
import { type MiddlewareHandler } from "hono"
import { logger } from "hono/logger"

import { Hono } from "@/shared/server/hono.js"

import { container } from "@/utils/typi.ts"

export class HonoMtaAuthenticator extends Hono {
  protected defaultMiddleware: MiddlewareHandler[] = [
    container.make(AuthorizeMtaCallsMiddleware).handle,
  ]

  constructor() {
    super()

    this.use(logger())
  }
}
