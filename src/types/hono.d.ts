import {} from "hono"

import type { TeamWithMembers } from "@/domains/shared/types/team"
import type {
  AccessToken,
  User,
} from "@/infrastructure/database/schema/types.ts"

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
