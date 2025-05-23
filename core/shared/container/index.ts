import type { Redis } from 'ioredis'
import type { Connection } from 'mysql2'
import type { Logger } from 'pino'

import type { DrizzleClient } from '#root/database/client.js'

import type { HonoInstance } from '#root/core/shared/server/hono.js'

import { container } from '#root/core/utils/typi.js'

export enum ContainerKey {
  app = 'app',

  logger = 'logger',

  // Configs
  env = 'env',
  config = 'config',

  // version
  version = 'version',

  // databases

  redis = 'redis',
  database = 'database',
  databaseConnection = 'databaseConnection',

  // Frontend assets
  viteManifestFile = 'viteManifestFile',

  // functions
  vikeRenderPage = 'vikeRenderPage',
}

export const makeApp = () => container.singleton<HonoInstance>(ContainerKey.app)

export const makeDatabase = () =>
  container.singleton<DrizzleClient>(ContainerKey.database)

export const makeRedis = () => container.singleton<Redis>(ContainerKey.redis)

export const makeDatabaseConnection = () =>
  container.singleton<Connection>(ContainerKey.databaseConnection)

export const makeLogger = () => container.singleton<Logger>(ContainerKey.logger)
