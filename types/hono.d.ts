import "hono"

import type {
  AccessToken,
  Contact,
  Team,
  TeamMembership,
  TeamWithSendingDomains,
  User,
  UserWithTeams,
} from "@/database/database_schema_types.ts"

import type { TeamWithMembers } from "@/shared/types/team.js"

declare module "hono" {
  interface ContextVariableMap {
    accessToken: AccessToken
    team: TeamWithMembers
    teamWithSendingDomains: TeamWithSendingDomains
    user: UserWithTeams
    contact: Contact
    memberships: (TeamMembership & { team: Team | null })[]
    flash: string | undefined
    pageProps: Record<string, any>
  }

  interface Context {
    accessToken: AccessToken
    team: TeamWithMembers
    user: UserWithTeams
    contact: Contact
  }
}
