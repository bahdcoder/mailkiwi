import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { logger } from "hono/logger"

import { Hono } from "@/shared/server/hono.js"

import { container } from "@/utils/typi.js"

export class HonoMtaInjector extends Hono {
  protected defaultMiddleware() {
    return [container.make(AuthorizeInjectorApiKeyMiddleware).handle]
  }

  constructor() {
    super()

    this.use(logger())
  }
}
