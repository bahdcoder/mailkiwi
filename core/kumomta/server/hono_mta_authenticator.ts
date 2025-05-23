import { AuthorizeMtaCallsMiddleware } from '#root/core/kumomta/middleware/authorize_mta_calls_middleware.js'
import { logger } from 'hono/logger'

import { Hono } from '#root/core/shared/server/hono.js'

import { container } from '#root/core/utils/typi.js'

export class HonoMtaAuthenticator extends Hono {
  protected defaultMiddleware() {
    return [container.make(AuthorizeMtaCallsMiddleware).handle]
  }

  constructor() {
    super()

    this.use(logger())
  }
}
