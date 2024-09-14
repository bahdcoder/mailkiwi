import { TeamPolicy } from "@/audiences/policies/team_policy.js"

import { AcceptTeamMemberInviteAction } from "@/teams/actions/accept_team_member_invite_action.ts"
import { InviteTeamMemberAction } from "@/teams/actions/invite_team_member_action.ts"
import { RejectTeamMemberInviteAction } from "@/teams/actions/reject_team_member_invite_action.ts"
import { RevokeTeamMemberAccessAction } from "@/teams/actions/revoke_team_member_access_action.ts"
import { InviteTeamMember } from "@/teams/dto/invite_team_member_dto.ts"
import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.ts"
import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.ts"

import type { HonoInstance } from "@/server/hono.js"
import type { HonoContext } from "@/server/types.js"

import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.ts"

import { container } from "@/utils/typi.js"

export class TeamMembershipController extends BaseController {
  constructor(
    private teamMembershipRepository = container.make(
      TeamMembershipRepository,
    ),
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()
    this.app.defineRoutes(
      [
        ["POST", "/", this.invite.bind(this)],
        ["PUT", "/:token", this.acceptInvite.bind(this)],
        ["DELETE", "/:token", this.rejectInvite.bind(this)],
        ["DELETE", "/:membershipId/access", this.revokeAccess.bind(this)],
      ],
      {
        prefix: "/memberships",
      },
    )
  }

  async invite(ctx: HonoContext) {
    const data = await this.validate(ctx, InviteTeamMember)

    const team = this.ensureCanAdministrate(ctx)

    const membershipExists =
      await this.teamMembershipRepository.membershipExists(
        data.email,
        team.id,
      )

    if (membershipExists) {
      throw E_VALIDATION_FAILED([
        {
          message: "This user is already a member of your team.",
        },
      ])
    }

    const { id } = await container
      .make(InviteTeamMemberAction)
      .handle(data, team.id)

    return ctx.json({ id })
  }

  async acceptInvite(ctx: HonoContext) {
    const invite = await this.ensureValidInvite(ctx)

    const authenticatedUser = this.user(ctx)

    if (invite.email !== authenticatedUser?.email) {
      throw E_UNAUTHORIZED(
        "You are not authorized to perform this action.",
      )
    }

    if (!invite.userId) {
      await this.teamMembershipRepository.update(invite.id, {
        userId: authenticatedUser.id,
      })

      invite.userId = authenticatedUser.id
    }

    const { id } = await container
      .make(AcceptTeamMemberInviteAction)
      .handle(invite)

    return ctx.json({ id })
  }

  async rejectInvite(ctx: HonoContext) {
    const invite = await this.ensureValidInvite(ctx)

    const authenticatedUser = this.user(ctx)

    if (invite.email !== authenticatedUser?.email) {
      throw E_UNAUTHORIZED(
        "You are not authorized to perform this action.",
      )
    }

    const { id } = await container
      .make(RejectTeamMemberInviteAction)
      .handle(invite)

    return ctx.json({ id })
  }

  async revokeAccess(ctx: HonoContext) {
    const invite = await this.ensureValidInviteId(ctx)

    if (this.user(ctx).id !== invite.userId) {
      this.ensureCanAdministrate(ctx)
    }

    const { id } = await container
      .make(RevokeTeamMemberAccessAction)
      .handle(invite)

    return ctx.json({ id })
  }

  async ensureValidInvite(ctx: HonoContext) {
    const invite =
      await this.teamMembershipRepository.findBySignedUrlToken(
        ctx.req.param("token"),
      )

    if (!invite) {
      throw E_VALIDATION_FAILED([
        { message: "Invite token provided is invalid", field: "token" },
      ])
    }

    if (invite.teamId !== this.team(ctx).id) {
      throw E_UNAUTHORIZED()
    }

    return invite
  }

  async ensureValidInviteId(ctx: HonoContext) {
    const invite = await this.teamMembershipRepository.findById(
      parseInt(ctx.req.param("membershipId")),
    )

    if (!invite) {
      throw E_VALIDATION_FAILED([
        {
          message: "Invite id provided is invalid",
          field: "token",
        },
      ])
    }

    if (invite.teamId !== this.team(ctx).id) {
      throw E_UNAUTHORIZED()
    }

    return invite
  }
}
