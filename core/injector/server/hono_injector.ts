import { AuthorizeInjectorApiKeyMiddleware } from '#root/core/injector/middleware/authorize_injector_api_key_middleware.js'
import { logger } from 'hono/logger'

import { Hono } from '#root/core/shared/server/hono.js'

import { container } from '#root/core/utils/typi.js'

export class HonoMtaInjector extends Hono {
  protected defaultMiddleware() {
    return [container.make(AuthorizeInjectorApiKeyMiddleware).handle]
  }

  constructor() {
    super()

    this.use(logger())
  }
}
