import type { TeamWithMembers } from '#root/core/shared/types/team.js'

export class AudiencePolicy {
  canCreate(team: TeamWithMembers, userId: string | null) {
    if (team?.userId === userId) return true

    const membership = team?.members.find(
      (member) =>
        member.userId === userId &&
        member.status === 'ACTIVE' &&
        member.role === 'ADMINISTRATOR',
    )

    if (membership) {
      return true
    }

    return false
  }
}
