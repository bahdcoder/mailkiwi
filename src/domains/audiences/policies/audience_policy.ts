import { TeamWithMembers } from "@/domains/shared/types/team"
import { Team, User } from "@prisma/client"
import { injectable } from "tsyringe"

@injectable()
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
