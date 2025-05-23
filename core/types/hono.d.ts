import 'hono'

import type {
  AccessToken,
  Contact,
  Team,
  TeamMembership,
  TeamWithSendingDomains,
  User,
  UserWithTeams,
} from '#root/database/database_schema_types.ts'

import type { TeamWithMembers } from '#root/core/shared/types/team.js'

declare module 'hono' {
  interface ContextVariableMap {
    accessToken: AccessToken
    team: TeamWithMembers
    teamWithSendingDomains: TeamWithSendingDomains
    user: UserWithTeams
    contact: Contact
    memberships: (TeamMembership & { team: Team | null })[]
    flash: string | undefined
    pageProps: Record<string, string | Record<string | Date>>
  }

  interface Context {
    accessToken: AccessToken
    team: TeamWithMembers
    user: UserWithTeams
    contact: Contact
  }
}
