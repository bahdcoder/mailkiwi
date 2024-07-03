import { container } from "tsyringe"
import type { PrismaClient } from "@prisma/client"
import { FastifyInstance } from "fastify"

import { EnvVariables } from "@/infrastructure/env"

export enum ContainerKey {
  app = "app",
  env = "env",
  database = "database",
}

export const makeApp = () =>
  container.resolve<FastifyInstance>(ContainerKey["app"])

export const makeEnv = () =>
  container.resolve<EnvVariables>(ContainerKey["env"])

export const makeDatabase = () =>
  container.resolve<PrismaClient>(ContainerKey["database"])
