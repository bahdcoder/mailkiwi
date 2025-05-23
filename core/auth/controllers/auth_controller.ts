import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { CreateTeamAccessTokenAction } from '#root/core/auth/actions/create_team_access_token.js'
import { LoginUserSchema } from '#root/core/auth/users/dto/login_user_dto.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'

/**
 * AuthController handles user authentication and API key management.
 *
 * This controller is responsible for core authentication functionality including:
 * 1. User login with email/password credentials
 * 2. User logout and session management
 * 3. API key generation for programmatic access
 *
 * The controller integrates with Kibamail's authentication system to validate credentials,
 * manage user sessions, and provide secure access to the application. It supports both
 * browser-based authentication (login/logout) and programmatic API access (API keys).
 */
export class AuthController extends BaseController {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamRepository = container.make(TeamRepository),
    private app = makeApp(),
  ) {
    super()

    // Define routes for browser-based authentication
    this.app.defineRoutes(
      [
        ['POST', '/login', this.login],
        ['POST', '/logout', this.logout],
      ],
      {
        prefix: 'auth',
        middleware: [],
      },
    )

    // Define routes for API key management
    this.app.defineRoutes([['POST', '/api-keys', this.createApiKey.bind(this)]], {
      prefix: 'auth',
    })
  }

  /**
   * Creates a new API key for the current team.
   *
   * This endpoint generates a secure API key that can be used for programmatic
   * access to the Kibamail API. The API key is associated with the current team
   * and inherits the permissions of the team.
   *
   * API keys are essential for integrating Kibamail with external systems and
   * automating workflows without requiring user interaction. They're commonly used for:
   * - Custom integrations with other marketing tools
   * - Automated data imports/exports
   * - Scheduled campaign management
   * - Webhook authentication
   *
   * @param ctx - The Hono request context containing the current team
   * @returns JSON response containing the newly generated API key
   */
  async createApiKey(ctx: HonoContext) {
    // Generate a new API key for the current team
    const { apiKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(ctx.get('team').id)

    // Return the API key to the client
    // Note: This is the only time the full API key will be visible
    return ctx.json({ apiKey })
  }

  /**
   * Authenticates a user with email and password credentials.
   *
   * This method implements the core login logic for Kibamail:
   * 1. Validates the login form data
   * 2. Retrieves the user account by email
   * 3. Verifies the password against the stored hash
   * 4. Creates a user session with the appropriate team context
   * 5. Redirects to the dashboard upon successful authentication
   *
   * The method includes special handling for users who previously authenticated
   * via OAuth providers (Google, GitHub), prompting them to use the same method
   * rather than attempting password login.
   *
   * @param ctx - The Hono request context containing the login form data
   * @returns Redirect response to the dashboard upon successful login
   * @throws E_VALIDATION_FAILED if authentication fails for any reason
   */
  login = async (ctx: HonoContext) => {
    // Validate the login form data against the schema
    const data = await this.validate(ctx, LoginUserSchema)

    // Retrieve the user account by email
    const user = await this.userRepository.findByEmail(data.email)

    // Prepare the generic error message for invalid credentials
    // Using a generic message avoids revealing whether the email exists
    const invalidCredentials = [
      {
        message: 'These credentials do not match our records.',
        field: 'email',
      },
    ]

    // If the user doesn't exist, return the generic error
    if (!user) {
      throw E_VALIDATION_FAILED(invalidCredentials)
    }

    // If the user has previously logged in with an OAuth provider,
    // direct them to use that method instead of password login
    if (!user.password) {
      throw E_VALIDATION_FAILED([
        {
          message: `You recently signed in using ${user.lastLoggedInProvider}. Please sign in using the same method.`,
          field: 'email',
        },
      ])
    }

    // Verify the password against the stored hash
    const passwordIsValid = await this.userRepository.verify(
      data.password,
      user.password as string,
    )

    // If the password is invalid, return the generic error
    if (!passwordIsValid) {
      throw E_VALIDATION_FAILED(invalidCredentials)
    }

    // Retrieve the user's default team for the session context
    const team = await this.teamRepository.findUserDefaultTeam(user.id)

    // Create a new session for the authenticated user
    await this.session.createForUser(ctx, {
      userId: user.id,
      currentTeamId: team.id,
    })

    // Redirect to the dashboard upon successful authentication
    return this.response(ctx).redirect(route('dashboard')).send()
  }

  /**
   * Logs out the current user by clearing their session.
   *
   * This method handles the user logout process:
   * 1. Clears the user's session data from cookies
   * 2. Redirects the user to the login page
   *
   * Proper logout is essential for security, especially on shared computers,
   * as it ensures that the user's session is completely terminated and cannot
   * be reused by subsequent users of the same browser.
   *
   * @param ctx - The Hono request context
   * @returns Redirect response to the login page
   */
  logout = async (ctx: HonoContext) => {
    // Clear the user's session data from cookies
    await this.session.clearForUser(ctx)

    // Redirect to the login page
    return this.response(ctx).redirect(route('auth_login')).send()
  }
}
