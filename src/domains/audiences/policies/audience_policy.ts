import { TeamWithMembers } from "@/domains/shared/types/team.js"

export class AudiencePolicy {
  canCreate(team: TeamWithMembers, userId: string) {
    if (team?.userId === userId) return true

    const membership = team?.members.find(
      (member) =>
        member.userId === userId &&
        member.status === "ACTIVE" &&
        member.role === "ADMINISTRATOR",
    )

    if (membership) {
      return true
    }

    return false
  }
}
