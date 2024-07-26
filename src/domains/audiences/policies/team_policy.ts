import type { TeamWithMembers } from '@/domains/shared/types/team.js'

export class TeamPolicy {
  canAdministrate(team: TeamWithMembers, userId: string | null) {
    return (
      team?.userId === userId ||
      team?.members.find(
        (member) => member.userId === userId && member.role === 'ADMINISTRATOR',
      )
    )
  }

  canView(team: TeamWithMembers, userId: string | null) {
    return (
      team?.userId === userId ||
      team?.members.find((member) => member.userId === userId)
    )
  }
}
