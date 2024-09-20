import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"

import { TeamMembership } from "@/database/schema/database_schema_types.js"

import { container } from "@/utils/typi.js"

export class RejectTeamMemberInviteAction {
  constructor(
    protected teamMembershipRepository = container.make(
      TeamMembershipRepository,
    ),
  ) {}

  handle = async (invite: TeamMembership) => {
    await this.teamMembershipRepository.delete(invite.id)

    return { id: invite.id }
  }
}
