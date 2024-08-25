import "hono"

import type {
  AccessToken,
  User,
} from "@/database/schema/database_schema_types.js"

import type { TeamWithMembers } from "@/shared/types/team"

declare module "hono" {
  interface ContextVariableMap {
    accessToken: AccessToken
    team: TeamWithMembers
    user: User
  }

  interface Context {
    accessToken: AccessToken
    team: TeamWithMembers
    user: User
  }
}
