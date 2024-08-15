import type { Team, TeamMembership } from '@/database/schema/types.js'

export type TeamWithMembers = Team & {
  members: TeamMembership[]
}
