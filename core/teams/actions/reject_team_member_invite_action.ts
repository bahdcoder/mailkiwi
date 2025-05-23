import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import type { TeamMembership } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class RejectTeamMemberInviteAction {
  constructor(
    protected teamMembershipRepository = container.make(TeamMembershipRepository),
  ) {}

  handle = async (invite: TeamMembership) => {
    await this.teamMembershipRepository.delete(invite.id)

    return { id: invite.id }
  }
}
