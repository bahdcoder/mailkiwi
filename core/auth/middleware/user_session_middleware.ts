import { appEnv } from '#root/core/app/env/app_env.js'
import type { Next } from 'hono'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import type { UserWithTeams } from '#root/database/database_schema_types.js'

import type { HonoContext } from '#root/core/shared/server/types.js'
import { Session } from '#root/core/shared/sessions/sessions.js'

import { container } from '#root/core/utils/typi.js'

/**
 * UserSessionMiddleware handles user authentication and session management.
 *
 * This middleware is a critical component of Kibamail's authentication system, responsible for:
 * 1. Retrieving and validating user sessions from cookies
 * 2. Loading the authenticated user and their team memberships
 * 3. Loading contact information for contact-specific sessions
 * 4. Determining the current active team context
 * 5. Making user and team data available to downstream middleware and controllers
 *
 * The middleware supports two distinct authentication contexts:
 * - User sessions: For authenticated admin/team users accessing the dashboard
 * - Contact sessions: For end-users (contacts) accessing preference centers or forms
 *
 * This dual-session approach enables Kibamail to maintain separate authentication
 * contexts for administrators and their contacts, which is essential for features
 * like preference centers where contacts can manage their own subscription preferences.
 */
export class UserSessionMiddleware {
  constructor(
    private teamRepository = container.make(TeamRepository),
    private contactRepository = container.make(ContactRepository),
  ) {}

  /**
   * Processes the request to load and validate user and contact sessions.
   *
   * This method implements the core session handling logic:
   * 1. Retrieves both user and contact sessions from cookies
   * 2. Loads the authenticated user with their team memberships if a user session exists
   * 3. Loads the authenticated contact if a contact session exists
   * 4. Determines the current team context from session, headers, or defaults
   * 5. Makes all authentication data available to downstream handlers via context
   *
   * The middleware doesn't block requests without valid sessions, allowing public
   * routes to function normally. Routes requiring authentication should use additional
   * middleware like MustBeAuthenticatedMiddleware to enforce authentication requirements.
   *
   * @param ctx - The Hono request context
   * @param next - The next middleware function
   * @returns The result of the next middleware
   */
  handle = async (ctx: HonoContext, next: Next) => {
    // Retrieve both user and contact sessions in parallel for efficiency
    const [userSession, contactSession] = await Promise.all([
      new Session().getUser(ctx),
      new Session().getUser(ctx, 'contact'),
    ])

    let authenticatedUser: UserWithTeams | null = null

    // If a user session exists, load the user and their team memberships
    if (userSession?.userId) {
      // Load the user with their teams and team memberships in a single efficient query
      const { user, memberships } = await container
        .make(UserRepository)
        .findWithTeamsAndMemberships(userSession.userId)

      authenticatedUser = user

      if (user) {
        // Make user and membership data available to downstream middleware and controllers
        ctx.set('user', user)
        ctx.set('memberships', memberships)
      }
    }

    // If a contact session exists, load the contact information
    // This is used for preference centers and other contact-facing features
    if (contactSession?.userId) {
      const contact = await this.contactRepository.findById(contactSession.userId)

      if (contact) {
        // Make contact data available to downstream middleware and controllers
        ctx.set('contact', contact)
      }
    }

    if (!authenticatedUser) {
      return next()
    }

    // Determine the current team context using a fallback hierarchy:
    // 1. First try to use the team ID stored in the user's session
    // 2. Then check for a team ID specified in the request headers
    // 3. Finally fall back to the user's first team if available
    //
    // This approach supports multiple use cases:
    // - Users switching between teams in the UI (stored in session)
    // - API requests specifying a team context in headers
    // - Default team selection for new sessions
    const teamHeader =
      userSession?.currentTeamId ??
      ctx.req.header(appEnv.software.teamHeader) ??
      authenticatedUser?.teams?.[0]?.id

    if (teamHeader && teamHeader !== 'undefined') {
      // Load the team data and make it available to downstream handlers
      const team = await this.teamRepository.findById(teamHeader)

      if (team) {
        ctx.set('team', team)
      }
    }

    return next()
  }
}
