import type { Redis } from "ioredis"
import type { Connection } from "mysql2"

import type { DrizzleClient } from "@/database/client.js"

import type { HonoInstance } from "@/shared/server/hono.js"

import { container } from "@/utils/typi.js"

export enum ContainerKey {
  // Apps
  app = "app",

  mtaAuthenticatorApp = "mtaAuthenticatorApp",
  mtaLogProcessorApp = "mtaLogProcessorApp",
  mtaInjectorApp = "mtaInjectorApp",

  // Configs
  env = "env",
  config = "config",

  // databases

  redis = "redis",
  database = "database",
  databaseConnection = "databaseConnection",

  // Frontend assets
  viteManifestFile = "viteManifestFile",
}

export const makeApp = () =>
  container.singleton<HonoInstance>(ContainerKey.app)

export const makeMtaAuthenticatorApp = () =>
  container.singleton<HonoInstance>(ContainerKey.mtaAuthenticatorApp)

export const makeMtaInjectorApp = () =>
  container.singleton<HonoInstance>(ContainerKey.mtaInjectorApp)

export const makeMtaLogProcessorApp = () =>
  container.singleton<HonoInstance>(ContainerKey.mtaLogProcessorApp)

export const makeDatabase = () =>
  container.singleton<DrizzleClient>(ContainerKey.database)

export const makeRedis = () =>
  container.singleton<Redis>(ContainerKey.redis)

export const makeDatabaseConnection = () =>
  container.singleton<Connection>(ContainerKey.databaseConnection)
