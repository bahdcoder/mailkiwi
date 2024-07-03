import type { TeamWithMembers } from "@/domains/shared/types/team"
import type { AccessToken, User } from "@prisma/client"
import {
  RegisterOptions,
  RouteHandlerMethod,
  HTTPMethods,
  onRequestHookHandler,
} from "fastify"

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
    team: NonNullable<TeamWithMembers>
    user: User
  }
}
