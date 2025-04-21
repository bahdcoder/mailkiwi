import type { Team, TeamMembership } from '@/database/database_schema_types.js'

export type TeamWithMembers = Team & {
  members: TeamMembership[]
}
