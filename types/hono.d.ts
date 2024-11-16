import "hono"

import type {
  AccessToken,
  Contact,
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
    contact: Contact
  }

  interface Context {
    accessToken: AccessToken
    team: TeamWithMembers
    user: User
    contact: Contact
  }
}
