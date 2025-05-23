import { DateTime } from 'luxon'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import type { TeamMembership } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { container } from '#root/core/utils/typi.js'

export class AcceptTeamMemberInviteAction {
  constructor(
    protected teamMembershipRepository = container.make(TeamMembershipRepository),
  ) {}

  private validateInviteExpiry(invite: TeamMembership) {
    if (DateTime.fromJSDate(invite.expiresAt) < DateTime.now()) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invitation has expired. Please ask for the invitation to be resent.',
          field: 'token',
        },
      ])
    }

    return invite
  }

  handle = async (invite: TeamMembership) => {
    this.validateInviteExpiry(invite)

    await this.teamMembershipRepository.update(invite.id, {
      status: 'ACTIVE',
    })

    return { id: invite.id }
  }
}
