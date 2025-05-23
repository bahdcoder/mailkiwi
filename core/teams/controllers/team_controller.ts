import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

/**
 * TeamController manages team information and team switching functionality.
 *
 * This controller is responsible for:
 * 1. Retrieving team details for display in the UI
 * 2. Handling team switching for users with multiple team memberships
 * 3. Enforcing proper access control for team resources
 *
 * Teams are a fundamental organizational unit in Kibamail, providing
 * multi-tenant isolation and enabling collaboration between users
 * working on the same email marketing campaigns and audiences.
 */
export class TeamController extends BaseController {
  constructor(private app = makeApp()) {
    super()
    this.app.defineRoutes(
      [
        ['GET', '/:teamId', this.show.bind(this)],
        ['GET', '/:teamId/switch', this.switch.bind(this)],
      ],
      {
        prefix: 'teams',
      },
    )
  }

  /**
   * Retrieves team information.
   *
   * Returns detailed information about a team if the authenticated user
   * has permission to view it. This endpoint is used to display team
   * details in the UI and verify team access.
   */
  async show(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: 'Unknown team ID provided.',
          field: 'teamId',
        },
      ])

    this.ensureCanView(ctx)

    return ctx.json(team)
  }

  /**
   * Switches the user's active team.
   *
   * Changes the user's current active team context to the specified team,
   * if they are a member or owner of that team. This enables users to
   * work across multiple teams without needing to log out and back in.
   */
  async switch(ctx: HonoContext) {
    const memberships = ctx.get('memberships')

    const teamId = ctx.req.param('teamId')
    const user = ctx.get('user')

    const isAnActiveMemberOfTeam = memberships.some(
      (membership) => membership.teamId === teamId,
    )

    const isTeamOwner = user?.teams.some((team) => team.id === teamId)

    if (isAnActiveMemberOfTeam || isTeamOwner) {
      await this.session.updateCurrentSessionTeamId(ctx, teamId)
    }

    return this.response(ctx).redirect(route('dashboard')).send()
  }
}
