import type { ConfigVariables, EnvVariables } from '@/shared/env/index.js'
import { container } from '@/utils/typi.js'
import type { Connection } from 'mysql2'
import type { DrizzleClient } from '@/database/client.js'
import type { HonoInstance } from '@/server/hono.js'

export enum ContainerKey {
  app = 'app',
  env = 'env',
  config = 'config',
  database = 'database',
  viteManifestFile = 'viteManifestFile',
  databaseConnection = 'databaseConnection',
}

export const makeApp = () => container.singleton<HonoInstance>(ContainerKey.app)

export const makeEnv = () => container.make<EnvVariables>(ContainerKey.env)

export const makeConfig = () =>
  container.singleton<ConfigVariables>(ContainerKey.config)

export const makeDatabase = (): DrizzleClient =>
  container.singleton<DrizzleClient>(ContainerKey.database)

export const makeDatabaseConnection = () =>
  container.singleton<Connection>(ContainerKey.databaseConnection)
