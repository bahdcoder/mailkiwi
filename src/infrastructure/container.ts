import { ConfigVariables, EnvVariables } from "@/infrastructure/env.js"
import { container } from "@/utils/typi.js"

import { DrizzleClient } from "./database/client.ts"
import { HonoInstance } from "./server/hono.ts"

export enum ContainerKey {
  app = "app",
  env = "env",
  config = "config",
  database = "database",
}

export const makeApp = () => container.make<HonoInstance>(ContainerKey["app"])

export const makeEnv = () => container.make<EnvVariables>(ContainerKey["env"])

export const makeConfig = () =>
  container.make<ConfigVariables>(ContainerKey["config"])

export const makeDatabase = () =>
  container.singleton<DrizzleClient>(ContainerKey["database"])
