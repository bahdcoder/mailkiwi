import type { PrismaClient } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { container } from "tsyringe"

import { ConfigVariables, EnvVariables } from "@/infrastructure/env"

export enum ContainerKey {
  app = "app",
  env = "env",
  config = "config",
  database = "database",
}

export const makeApp = () =>
  container.resolve<FastifyInstance>(ContainerKey["app"])

export const makeEnv = () =>
  container.resolve<EnvVariables>(ContainerKey["env"])

export const makeConfig = () =>
  container.resolve<ConfigVariables>(ContainerKey["config"])

export const makeDatabase = () =>
  container.resolve<PrismaClient>(ContainerKey["database"])
