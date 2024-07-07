import {
  HTTPMethods,
  onRequestHookHandler,
  RegisterOptions,
  RouteHandlerMethod,
} from "fastify"

import type { TeamWithMembers } from "@/domains/shared/types/team"
import { AccessToken, User } from "@/infrastructure/database/schema/types.ts"

declare module "fastify" {
  interface FastifyInstance {
    defineRoutes: (
      routes: [HTTPMethods, string, RouteHandlerMethod][],
      opts?: RegisterOptions & {
        onRequestHooks?: onRequestHookHandler[]
      },
    ) => void
  }

  interface FastifyRequest {
    accessToken: AccessToken
    team: TeamWithMembers
    user: User
  }
}
