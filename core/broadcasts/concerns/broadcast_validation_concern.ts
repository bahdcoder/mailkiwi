import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { TeamPolicy } from '#root/core/audiences/policies/team_policy.js'

import type { BroadcastWithoutContent } from '#root/database/database_schema_types.js'

import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * BroadcastValidationAndAuthorizationConcern handles validation and authorization for broadcast operations.
 *
 * This class is responsible for ensuring that broadcast operations meet both validation
 * and authorization requirements. It implements reusable validation and permission checks
 * that are used across multiple controllers and actions in the broadcast system.
 *
 * The concern provides two primary functions:
 * 1. Validating that broadcasts exist and are accessible
 * 2. Verifying that users have appropriate permissions to perform operations
 *
 * By centralizing these checks, the system maintains consistent validation and
 * authorization logic across all broadcast-related operations, reducing code duplication
 * and ensuring security policies are uniformly applied.
 */
export class BroadcastValidationAndAuthorizationConcern {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
    private teamPolicy: TeamPolicy = container.make(TeamPolicy),
  ) {}

  /**
   * Ensures that a broadcast exists and is accessible.
   *
   * This method validates that the broadcast specified in the request exists in the database.
   * It's a critical security check that prevents operations on non-existent broadcasts and
   * provides consistent error handling for invalid broadcast IDs.
   *
   * The method is used as a prerequisite for most broadcast operations, ensuring that
   * the broadcast is available before attempting to perform actions on it. This prevents
   * errors and security issues that could arise from operating on non-existent resources.
   *
   * @param ctx - The HTTP context containing the broadcast ID parameter
   * @param opts - Optional configuration for loading related data
   * @returns The broadcast if it exists
   * @throws E_VALIDATION_FAILED if the broadcast doesn't exist
   */
  public async ensureBroadcastExists(
    ctx: HonoContext,
    opts?: { loadAbTestVariants?: boolean },
  ) {
    const broadcast = await this.broadcastRepository.findById(
      ctx.req.param('broadcastId'),
    )

    if (!broadcast) {
      throw E_VALIDATION_FAILED([{ message: 'Unknown broadcast.', field: 'id' }])
    }

    return broadcast
  }

  /**
   * Ensures that the user has permission to perform operations on a broadcast.
   *
   * This method implements a two-level authorization check:
   * 1. Verifies that the broadcast belongs to the current team context
   * 2. Confirms that the user has administrative permissions within the team
   *
   * These checks prevent unauthorized access to broadcasts from other teams and
   * ensure that only users with appropriate permissions can perform sensitive
   * operations like sending or deleting broadcasts.
   *
   * The method is used as a prerequisite for operations that require elevated
   * permissions, providing consistent authorization logic across the system.
   *
   * @param ctx - The HTTP context containing team and user information
   * @param broadcast - Optional broadcast to check ownership of
   * @throws E_UNAUTHORIZED if the user doesn't have permission
   */
  public async ensureHasPermissions(
    ctx: HonoContext,
    broadcast?: BroadcastWithoutContent,
  ) {
    const team = ctx.get('team')
    const userId = ctx.get('accessToken').userId

    if (broadcast && broadcast.teamId !== team.id) {
      throw E_UNAUTHORIZED()
    }

    if (!this.teamPolicy.canAdministrate(team, userId)) {
      throw E_UNAUTHORIZED()
    }
  }
}
