import type { TeamWithMembers } from '#root/core/shared/types/team.js'

/**
 * TeamPolicy implements the authorization rules for team-based permissions.
 *
 * This class is a critical component of Kibamail's multi-tenant authorization system,
 * providing a centralized implementation of the permission rules that govern what
 * actions users can perform within teams. It implements a role-based access control
 * (RBAC) system with hierarchical permissions:
 *
 * - Owner: Has full control over the team (created the team)
 * - Administrator: Can manage team settings and members
 * - Manager: Can manage content but not team settings
 * - Author: Can create and edit content
 * - Viewer: Can only view content
 *
 * The policy is used throughout the application to enforce consistent access control,
 * ensuring that users can only perform actions they're authorized for.
 */
export class TeamPolicy {
  /**
   * Determines if a user can administrate a team.
   *
   * Administrative permissions include:
   * - Managing team settings
   * - Inviting and removing team members
   * - Changing team member roles
   * - Managing billing and subscription
   * - Configuring sending domains
   *
   * This permission level is granted to team owners and members with the
   * ADMINISTRATOR role. It represents the highest level of access within a team.
   *
   * @param team - The team to check permissions for
   * @param userId - The ID of the user to check
   * @returns True if the user can administrate the team, false otherwise
   */
  canAdministrate(team: TeamWithMembers, userId: string | null) {
    // Team owners always have administrative permissions
    const isOwner = team?.userId === userId

    // Members with the ADMINISTRATOR role also have administrative permissions
    const isAdministrator =
      team?.members.find(
        (member) =>
          member.userId === userId &&
          member.role === 'ADMINISTRATOR' &&
          member.status === 'ACTIVE',
      ) !== undefined

    return isOwner || isAdministrator
  }

  /**
   * Determines if a user can manage content within a team.
   *
   * Management permissions include:
   * - Creating and editing broadcasts
   * - Managing audiences and segments
   * - Creating and editing automations
   * - Viewing analytics and reports
   *
   * This permission level is granted to team members with the MANAGER role
   * and above (including ADMINISTRATOR and owner). It represents a mid-level
   * access that can manage content but not team settings.
   *
   * The method implements permission inheritance, where higher roles
   * automatically have all permissions of lower roles.
   *
   * @param team - The team to check permissions for
   * @param userId - The ID of the user to check
   * @returns True if the user can manage the team's content, false otherwise
   */
  canManage(team: TeamWithMembers, userId: string | null) {
    // Administrators can always manage content
    const canAdministrate = this.canAdministrate(team, userId)

    // Check if the user has the MANAGER role
    const isManager = team?.members?.find(
      (member) =>
        member.userId && member.role === 'MANAGER' && member.status === 'ACTIVE',
    )

    // Either a manager or administrator can manage content
    return isManager || canAdministrate
  }

  /**
   * Determines if a user can author content within a team.
   *
   * Authoring permissions include:
   * - Creating and editing email content
   * - Managing contact lists
   * - Creating and editing templates
   *
   * This permission level is granted to team members with the AUTHOR role
   * and above (including MANAGER, ADMINISTRATOR, and owner). It represents
   * a basic level of content creation access.
   *
   * The method implements permission inheritance, where higher roles
   * automatically have all permissions of lower roles.
   *
   * @param team - The team to check permissions for
   * @param userId - The ID of the user to check
   * @returns True if the user can author content, false otherwise
   */
  canAuthor(team: TeamWithMembers, userId: string | null) {
    // Managers can always author content
    const canManage = this.canManage(team, userId)

    // Check if the user has the AUTHOR role
    const isAuthor = team?.members?.find(
      (member) => member.userId && member.role === 'AUTHOR' && member.status === 'ACTIVE',
    )

    // Either an author, manager, or administrator can author content
    return isAuthor || canManage
  }

  /**
   * Determines if a user can view content within a team.
   *
   * Viewing permissions include:
   * - Viewing broadcasts, audiences, and automations
   * - Viewing analytics and reports
   * - Accessing team resources
   *
   * This permission level is granted to any team member, regardless of role,
   * as well as the team owner. It represents the minimum level of access
   * required to interact with a team's content.
   *
   * Unlike the other permission methods, this one doesn't check for specific
   * roles or active status - any association with the team grants view access.
   *
   * @param team - The team to check permissions for
   * @param userId - The ID of the user to check
   * @returns True if the user can view the team's content, false otherwise
   */
  canView(team: TeamWithMembers, userId: string | null) {
    return (
      // Either the team owner or any team member can view content
      team?.userId === userId || team?.members.find((member) => member.userId === userId)
    )
  }
}
