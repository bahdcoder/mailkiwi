import { appEnv, type AppEnvVariables } from '#root/core/app/env/app_env.js'

import type { DrizzleClient } from '#root/database/client.js'

import { Cache } from '#root/core/shared/cache/cache.js'
import { makeDatabase } from '#root/core/shared/container/index.js'

import { BaseRepository as FrameworkBaseRepository } from '@kibamail/framework'

export class BaseRepository extends FrameworkBaseRepository<
  DrizzleClient,
  Cache,
  AppEnvVariables
> {
  constructor() {
    super(makeDatabase(), new Cache(), appEnv)
  }
}
