import { AcceptTeamMemberInviteAction } from '#root/core/teams/actions/accept_team_member_invite_action.js'
import { InviteTeamMemberAction } from '#root/core/teams/actions/invite_team_member_action.js'
import { RejectTeamMemberInviteAction } from '#root/core/teams/actions/reject_team_member_invite_action.js'
import { ResendTeamMemberInviteAction } from '#root/core/teams/actions/resend_team_member_invite_action.js'
import { RevokeTeamMemberAccessAction } from '#root/core/teams/actions/revoke_team_member_access_action.js'
import { UpdateTeamMemberRoleAction } from '#root/core/teams/actions/update_team_member_role_action.js'
import { InviteTeamMember } from '#root/core/teams/dto/invite_team_member_dto.js'
import { UpdateTeamMemberRole } from '#root/core/teams/dto/update_team_member_role_dto.js'
import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import type { TeamMembership } from '#root/database/database_schema_types.js'

import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * TeamMembershipController handles API endpoints for managing team memberships.
 *
 * This controller is responsible for the team collaboration functionality in Kibamail,
 * providing endpoints to invite, accept, reject, and revoke team memberships. These
 * features enable multi-user collaboration within teams, with different permission
 * levels based on roles:
 *
 * - Administrators: Can manage team settings and members
 * - Managers: Can manage content but not team settings
 * - Authors: Can create and edit content
 *
 * The controller enforces proper authorization for all membership operations,
 * ensuring that only authorized users can perform sensitive actions like inviting
 * new members or revoking access.
 */
export class TeamMembershipController extends BaseController {
  constructor(
    private teamMembershipRepository = container.make(TeamMembershipRepository),
    private teamRepository = container.make(TeamRepository),
    private app = makeApp(),
  ) {
    super()
    this.app.defineRoutes(
      [
        ['POST', '/', this.invite.bind(this)],
        // Leave the current team (must come before /:token to avoid conflicts)
        ['DELETE', '/leave', this.leaveTeam.bind(this)],
        ['PUT', '/:token', this.acceptInvite.bind(this)],
        ['DELETE', '/:token', this.rejectInvite.bind(this)],
        ['PUT', '/:membershipId/role', this.updateRole.bind(this)],
        ['POST', '/:membershipId/resend', this.resendInvite.bind(this)],
        ['DELETE', '/:membershipId/access', this.revokeAccess.bind(this)],
      ],
      {
        prefix: '/memberships',
      },
    )
  }

  /**
   * Invites a new member to join the team.
   *
   * This method implements the team invitation process:
   * 1. Validates the invitation data
   * 2. Ensures the current user has administrative permissions
   * 3. Checks if the user is already a team member
   * 4. Creates the invitation and sends an email to the invitee
   *
   * The invitation includes the specified role, which determines what
   * permissions the user will have if they accept the invitation. This
   * role-based approach allows teams to have different levels of access
   * for different members.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the invitation ID
   * @throws E_VALIDATION_FAILED if the user is already a team member
   */
  async invite(ctx: HonoContext) {
    // Validate the invitation data
    const data = await this.validate(ctx, InviteTeamMember)

    // Ensure the current user has administrative permissions
    const team = this.ensureCanAdministrate(ctx)

    // Check if the user is already a team member
    const membershipExists = await this.teamMembershipRepository.membershipExists(
      data.email,
      team.id,
    )

    // Prevent duplicate invitations
    if (membershipExists) {
      throw E_VALIDATION_FAILED([
        {
          message: 'This user is already a member of your team.',
        },
      ])
    }

    // Create the invitation and send an email to the invitee
    const { id } = await container.make(InviteTeamMemberAction).handle(data, team.id)

    return ctx.json({ id })
  }

  /**
   * Accepts a team invitation.
   *
   * This method implements the invitation acceptance process:
   * 1. Validates the invitation token
   * 2. Ensures the current user is the intended recipient
   * 3. Links the invitation to the user's account if needed
   * 4. Activates the team membership
   *
   * The method includes security checks to ensure that only the intended
   * recipient can accept the invitation, preventing unauthorized access to teams.
   * It also handles the case where a user might be invited by email before
   * creating an account, linking the invitation to their account when they accept.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the membership ID
   * @throws E_UNAUTHORIZED if the user is not the intended recipient
   */
  async acceptInvite(ctx: HonoContext) {
    // Validate the invitation token
    const invite = await this.ensureValidInvite(ctx)

    // Get the authenticated user
    const authenticatedUser = this.user(ctx)

    // Ensure the current user is the intended recipient
    if (invite.email !== authenticatedUser?.email) {
      throw E_UNAUTHORIZED('You are not authorized to perform this action.')
    }

    // Link the invitation to the user's account if needed
    // This handles the case where a user was invited by email before creating an account
    if (!invite.userId) {
      await this.teamMembershipRepository.update(invite.id, {
        userId: authenticatedUser.id,
      })

      invite.userId = authenticatedUser.id
    }

    // Activate the team membership
    const { id } = await container.make(AcceptTeamMemberInviteAction).handle(invite)

    return ctx.json({ id })
  }

  /**
   * Rejects a team invitation.
   *
   * This method implements the invitation rejection process:
   * 1. Validates the invitation token
   * 2. Ensures the current user is the intended recipient
   * 3. Deletes the invitation
   *
   * The method includes security checks to ensure that only the intended
   * recipient can reject the invitation, preventing unauthorized manipulation
   * of team invitations.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the deleted invitation ID
   * @throws E_UNAUTHORIZED if the user is not the intended recipient
   */
  async rejectInvite(ctx: HonoContext) {
    // Validate the invitation token
    const invite = await this.ensureValidInvite(ctx)

    // Get the authenticated user
    const authenticatedUser = this.user(ctx)

    // Ensure the current user is the intended recipient
    if (invite.email !== authenticatedUser?.email) {
      throw E_UNAUTHORIZED('You are not authorized to perform this action.')
    }

    // Delete the invitation
    const { id } = await container.make(RejectTeamMemberInviteAction).handle(invite)

    return ctx.json({ id })
  }

  /**
   * Updates a team member's role.
   *
   * This method implements the role update process:
   * 1. Validates the membership ID and role data
   * 2. Ensures the current user has administrative permissions
   * 3. Validates that the membership is active and belongs to the team
   * 4. Prevents changing the role of team owners
   * 5. Updates the membership role
   *
   * Only team administrators can update member roles, and team owners
   * cannot have their roles changed to maintain team ownership integrity.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the membership ID
   * @throws E_UNAUTHORIZED if the user doesn't have administrative permissions
   * @throws E_VALIDATION_FAILED if the membership is invalid
   */
  async updateRole(ctx: HonoContext) {
    const data = await this.validate(ctx, UpdateTeamMemberRole)

    const team = this.ensureCanAdministrate(ctx)

    const membership = await this.ensureExists<TeamMembership>(ctx, 'membershipId')

    const { id } = await container
      .make(UpdateTeamMemberRoleAction)
      .handle(membership, data, team.id)

    return ctx.json({ id })
  }

  /**
   * Resends an invitation to a pending team member.
   *
   * This method implements the invitation resend process:
   * 1. Validates the membership ID and ensures it exists
   * 2. Ensures the current user has administrative permissions
   * 3. Validates that the membership is pending and belongs to the team
   * 4. Extends the invitation expiration and resends the email
   *
   * Only team administrators can resend invitations, and only pending
   * memberships can have their invitations resent. This helps manage
   * expired invitations and provides a way to remind users about
   * pending team invitations.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the membership ID
   * @throws E_UNAUTHORIZED if the user doesn't have administrative permissions
   * @throws E_VALIDATION_FAILED if the membership is not pending or invalid
   */
  async resendInvite(ctx: HonoContext) {
    const team = this.ensureCanAdministrate(ctx)

    const membership = await this.ensureExists<TeamMembership>(ctx, 'membershipId')

    const { id } = await container
      .make(ResendTeamMemberInviteAction)
      .handle(membership, team.id)

    return ctx.json({ id })
  }

  /**
   * Revokes access for a team member.
   *
   * This method implements the access revocation process:
   * 1. Validates the membership ID
   * 2. Ensures the current user has permission to revoke access
   * 3. Deactivates the team membership
   *
   * The method allows two types of users to revoke access:
   * - The team member themselves (leaving the team)
   * - Team administrators (removing a member)
   *
   * This dual permission approach allows both self-service team departures
   * and administrative member management.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the membership ID
   * @throws E_UNAUTHORIZED if the user doesn't have permission
   */
  async revokeAccess(ctx: HonoContext) {
    // Validate the membership ID
    const invite = await this.ensureExists<TeamMembership>(ctx, 'membershipId')

    // Check if the user is revoking their own access or has administrative permissions
    if (this.user(ctx).id !== invite.userId) {
      this.ensureCanAdministrate(ctx)
    }

    // Deactivate the team membership
    const { id } = await container.make(RevokeTeamMemberAccessAction).handle(invite)

    return ctx.json({ id })
  }

  /**
   * Validates a team invitation token and ensures it belongs to the current team.
   *
   * This helper method performs two critical validation steps:
   * 1. Verifies that the token corresponds to a valid invitation
   * 2. Ensures the invitation belongs to the current team context
   *
   * The second check is particularly important for security, as it prevents
   * users from accepting or rejecting invitations for teams they don't have
   * access to, even if they somehow obtained a valid token.
   *
   * @param ctx - The HTTP context containing the token parameter
   * @returns The validated team membership invitation
   * @throws E_VALIDATION_FAILED if the token is invalid
   * @throws E_UNAUTHORIZED if the invitation is for a different team
   */
  async ensureValidInvite(ctx: HonoContext) {
    // Retrieve the invitation using the signed URL token
    const invite = await this.teamMembershipRepository.findBySignedUrlToken(
      ctx.req.param('token'),
    )

    // Validate that the token corresponds to a valid invitation
    if (!invite) {
      throw E_VALIDATION_FAILED([
        { message: 'Invite token provided is invalid', field: 'token' },
      ])
    }

    // Ensure the invitation belongs to the current team context
    if (invite.teamId !== this.team(ctx).id) {
      throw E_UNAUTHORIZED()
    }

    return invite
  }

  async ensureValidInviteId(ctx: HonoContext) {
    const invite = await this.teamMembershipRepository.findById(
      ctx.req.param('membershipId'),
    )

    if (!invite) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invite id provided is invalid',
          field: 'token',
        },
      ])
    }

    if (invite.teamId !== this.team(ctx).id) {
      throw E_UNAUTHORIZED()
    }

    return invite
  }

  /**
   * Allows a user to leave the current team.
   *
   * This method implements the team departure process:
   * 1. Validates that the user is a member of the current team
   * 2. Ensures the team owner cannot leave their own team
   * 3. Removes the user's membership from the team
   * 4. Switches the user's active session to their default team
   *
   * The method prevents team owners from leaving their own teams to ensure
   * teams always have an owner. Regular team members can leave at any time.
   * After leaving, the user's session is automatically switched to their
   * default team (first owned team) to maintain a valid team context.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the deleted membership ID
   * @throws E_UNAUTHORIZED if the user is the team owner
   * @throws E_VALIDATION_FAILED if the user is not a member of the team
   */
  async leaveTeam(ctx: HonoContext) {
    const currentTeam = this.team(ctx)
    const user = this.user(ctx)

    if (currentTeam.userId === user.id) {
      throw E_UNAUTHORIZED('Team owners cannot leave their own team.')
    }

    const membership = currentTeam.members.find(
      (member) => member.userId === user.id && member.status === 'ACTIVE',
    )

    if (!membership) {
      throw E_VALIDATION_FAILED([
        {
          message: 'You are not a member of this team.',
        },
      ])
    }

    await container.make(RevokeTeamMemberAccessAction).handle(membership)

    const defaultTeam = await this.teamRepository.findUserDefaultTeam(user.id)

    if (defaultTeam) {
      await this.session.updateCurrentSessionTeamId(ctx, defaultTeam.id)
    }

    return ctx.json({ id: membership.id })
  }
}
