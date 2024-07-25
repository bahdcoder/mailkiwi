import type { ConfigVariables, EnvVariables } from '@/infrastructure/env.js'
import { container } from '@/utils/typi.js'

import type { DrizzleClient } from './database/client.js'
import type { HonoInstance } from './server/hono.js'
import type { Database } from 'better-sqlite3'

export enum ContainerKey {
  app = 'app',
  env = 'env',
  config = 'config',
  database = 'database',
  viteManifestFile = 'viteManifestFile',
  databaseConnection = 'databaseConnection',
}

export const makeApp = () => container.make<HonoInstance>(ContainerKey.app)

export const makeEnv = () => container.make<EnvVariables>(ContainerKey.env)

export const makeConfig = () =>
  container.make<ConfigVariables>(ContainerKey.config)

export const makeDatabase = () =>
  container.singleton<DrizzleClient>(ContainerKey.database)

export const makeDatabaseConnection = (): Database =>
  container.make<Database>(ContainerKey.databaseConnection)
