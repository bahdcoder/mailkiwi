import { DateTime } from "luxon"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.ts"

import { TeamMembership } from "@/database/schema/database_schema_types.ts"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.ts"

import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.ts"

import { container } from "@/utils/typi.js"

export class AcceptTeamMemberInviteAction {
  constructor(
    protected teamMembershipRepository = container.make(
      TeamMembershipRepository,
    ),
  ) {}

  private validateInviteExpiry(invite: TeamMembership) {
    if (DateTime.fromJSDate(invite.expiresAt) < DateTime.now()) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "Invitation has expired. Please ask for the invitation to be resent.",
          field: "token",
        },
      ])
    }

    return invite
  }

  handle = async (invite: TeamMembership) => {
    this.validateInviteExpiry(invite)

    await this.teamMembershipRepository.update(invite.id, {
      status: "ACTIVE",
    })

    return { id: invite.id }
  }
}
