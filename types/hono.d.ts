import "hono"

import type {
  AccessToken,
  TeamWithSendingDomains,
  User,
} from "@/database/database_schema_types.ts"

import type { TeamWithMembers } from "@/shared/types/team.js"

declare module "hono" {
  interface ContextVariableMap {
    accessToken: AccessToken
    team: TeamWithMembers
    teamWithSendingDomains: TeamWithSendingDomains
    user: User
  }

  interface Context {
    accessToken: AccessToken
    team: TeamWithMembers
    user: User
  }
}
