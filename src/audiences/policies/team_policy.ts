import type { TeamWithMembers } from "@/shared/types/team.js"

export class TeamPolicy {
  canAdministrate(team: TeamWithMembers, userId: number | null) {
    const isOwner = team?.userId === userId

    const isAdministrator =
      team?.members.find(
        (member) =>
          member.userId === userId &&
          member.role === "ADMINISTRATOR" &&
          member.status === "ACTIVE",
      ) !== undefined

    return isOwner || isAdministrator
  }

  canManage(team: TeamWithMembers, userId: number | null) {
    const canAdministrate = this.canAdministrate(team, userId)

    const isManager = team?.members?.find(
      (member) =>
        member.userId &&
        member.role === "MANAGER" &&
        member.status === "ACTIVE",
    )

    return isManager || canAdministrate
  }

  canView(team: TeamWithMembers, userId: number | null) {
    return (
      team?.userId === userId ||
      team?.members.find((member) => member.userId === userId)
    )
  }
}
