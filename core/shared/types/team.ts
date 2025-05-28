import type { Team, TeamMembership } from '#root/database/database_schema_types.js'

export type TeamWithMembers = Team & {
  members: TeamMembership[]
}
