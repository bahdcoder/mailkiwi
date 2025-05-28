import { Cache } from '#root/core/shared/cache/cache.js'
import { ScryptTokenRepository as FrameworkScryptTokenRepository } from '@kibamail/framework'

import type { DrizzleClient } from '#root/database/client.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { appEnv, type AppEnvVariables } from '#root/core/app/env/app_env'

export class ScryptTokenRepository extends FrameworkScryptTokenRepository<DrizzleClient, Cache, AppEnvVariables> {
  constructor() {
    super(makeDatabase(), new Cache(), appEnv)
  }
}
