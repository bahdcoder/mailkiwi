import type { UpdateTeamMemberRoleDto } from '#root/core/teams/dto/update_team_member_role_dto.js'
import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import type { TeamMembership } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { container } from '#root/core/utils/typi.js'

export class UpdateTeamMemberRoleAction {
  constructor(
    private teamMembershipRepository = container.make(TeamMembershipRepository),
    private teamRepository = container.make(TeamRepository),
  ) {}

  handle = async (
    membership: TeamMembership,
    payload: UpdateTeamMemberRoleDto,
    teamId: string,
  ) => {
    if (membership.status !== 'ACTIVE') {
      throw E_VALIDATION_FAILED([
        {
          message: 'Only active team members can have their roles updated.',
          field: 'membershipId',
        },
      ])
    }

    if (membership.teamId !== teamId) {
      throw E_VALIDATION_FAILED([
        {
          message: 'This membership does not belong to the specified team.',
          field: 'membershipId',
        },
      ])
    }

    const team = await this.teamRepository.findById(teamId)

    if (!team) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Team not found.',
          field: 'teamId',
        },
      ])
    }

    if (membership.userId === team.userId) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Team owners cannot have their role changed.',
          field: 'membershipId',
        },
      ])
    }

    await this.teamMembershipRepository.update(membership.id, {
      role: payload.role,
    })

    return { id: membership.id }
  }
}
