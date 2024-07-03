import { Team, TeamMembership } from "@prisma/client"

export type TeamWithMembers = Team & { members: TeamMembership[] }
