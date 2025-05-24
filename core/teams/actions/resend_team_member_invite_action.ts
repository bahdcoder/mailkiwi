import { DateTime } from 'luxon'

import { SendTeamMemberInviteJob } from '#root/core/teams/jobs/send_team_member_invite_job.js'
import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import type { TeamMembership } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export class ResendTeamMemberInviteAction {
  constructor(
    private teamMembershipRepository = container.make(TeamMembershipRepository),
  ) {}

  handle = async (membership: TeamMembership, teamId: string) => {
    if (membership.status !== 'PENDING') {
      throw E_VALIDATION_FAILED([
        {
          message: 'Only pending invitations can be resent.',
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

    await this.teamMembershipRepository.update(membership.id, {
      expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
      invitedAt: DateTime.now().toJSDate(),
    })

    await Queue.accounts().add(SendTeamMemberInviteJob.id, {
      inviteId: membership.id,
    })

    return { id: membership.id }
  }
}
