import { TeamWithMembers } from "@/domains/shared/types/team"
import { injectable } from "tsyringe"

@injectable()
export class TeamPolicy {
  canAdministrate(team: TeamWithMembers, userId: string) {
    return (
      team?.userId === userId ||
      team?.members.find(
        (member) => member.userId === userId && member.role === "ADMINISTRATOR",
      )
    )
  }

  canView(team: TeamWithMembers, userId: string) {
    return (
      team?.userId === userId ||
      team?.members.find((member) => member.userId === userId)
    )
  }
}
