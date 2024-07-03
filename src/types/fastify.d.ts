import type { AccessToken, User } from "@prisma/client"
import {
  HTTPMethods,
  onRequestHookHandler,
  RegisterOptions,
  RouteHandlerMethod,
} from "fastify"

import type { TeamWithMembers } from "@/domains/shared/types/team"

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
