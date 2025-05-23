import { and, eq } from 'drizzle-orm'
import { setCookie } from 'hono/cookie'

import { GithubDriver } from '#root/core/auth/oauth2_drivers/github_driver.js'
import { GoogleDriver } from '#root/core/auth/oauth2_drivers/google_driver.js'
import { Oauth2AccountsRepository } from '#root/core/auth/users/repositories/oauth2_accounts_repository.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { oauth2Accounts } from '#root/database/schema.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'

type Oauth2Params = {
  action: 'login' | 'register'
  provider: 'github' | 'google'
}

/**
 * Oauth2Controller handles third-party authentication via OAuth providers.
 *
 * This controller is responsible for:
 * 1. Initiating OAuth flows with providers like GitHub and Google
 * 2. Processing OAuth callbacks and authenticating users
 * 3. Creating and linking OAuth accounts with Kibamail user accounts
 * 4. Managing the OAuth state and security requirements
 *
 * OAuth authentication provides a secure and convenient way for users to
 * access Kibamail without creating separate credentials, leveraging their
 * existing accounts with trusted providers.
 */
export class Oauth2Controller extends BaseController {
  constructor(
    protected app = makeApp(),
    protected userRepository = container.make(UserRepository),
    protected oauth2AccountsRepository = container.make(Oauth2AccountsRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['GET', '/:action/oauth2/:provider/authorize', this.authorize],
        ['GET', '/oauth2/:provider/callback', this.callback],
      ],
      {
        prefix: 'auth',
        middleware: [],
      },
    )
  }

  /**
   * Returns OAuth driver instances for supported providers.
   *
   * Creates and configures provider-specific OAuth client instances
   * with the current HTTP context for state management.
   */
  protected drivers(ctx: HonoContext) {
    return {
      github: container.make(GithubDriver).setCtx(ctx),
      google: container.make(GoogleDriver).setCtx(ctx),
    } as const
  }

  protected OAUTH_2_ACTION_COOKIE_NAME = 'oauth2_action'

  /**
   * Handles OAuth callback requests from providers.
   *
   * Processes the OAuth response after a user has authenticated with a provider.
   * This method:
   * 1. Validates the OAuth state and response
   * 2. Retrieves user information from the provider
   * 3. Creates or retrieves the corresponding Kibamail user
   * 4. Establishes a user session upon successful authentication
   */
  callback = async (ctx: HonoContext) => {
    const params = ctx.req.param() as Oauth2Params

    const client = this.drivers(ctx)[params.provider]

    try {
      const response = await client.handleCallback()

      if (!response.user?.email) {
        this.flash(ctx, {
          title: `We coudn't find a verified email on your ${params.provider} account.`,
          description: 'Please try again or use another authentication method.',
          variant: 'error',
        })
        return this.response(ctx)
          .redirect(route(params.action === 'login' ? 'auth_login' : 'auth_register'))
          .send()
      }

      const [accountExists, userExists] = await Promise.all([
        this.oauth2AccountsRepository
          .accounts()
          .findOne(
            and(
              eq(oauth2Accounts.provider, params.provider),
              eq(oauth2Accounts.providerId, response.user.providerId),
            ),
          ),
        this.userRepository.findByEmail(response.user.email),
      ])

      if (response.action === 'login') {
        if (!accountExists || !userExists) {
          this.flash(ctx, {
            title: `We could not find a user with this ${params.provider} account.`,
            description: `Please register a new account if you haven't done so before.`,
            variant: 'error',
          })

          return this.response(ctx).redirect(route('auth_login')).send()
        }

        // TODO: Allow account linking here by creating a unique session, and asking user to confirm linking by providing their password. Here's now it will work:

        // 1. Store new account into database with confirmed: false
        // 2. Create a cookie with the account id, userId and redirect user to a page to confirm password to link account.
        // 3. On submit of that page, get account id and user id from session. compare user password to see if correct.
        // 4. if eveyrthing is good, mark account as confirmed: true, create user session, and redirect user to dashboard.

        // Create a temporary session for the user by setting a cookie with
        if (userExists && !accountExists) {
          this.flash(ctx, {
            title: `We found your account, but you previously logged in using ${userExists?.lastLoggedInProvider}. Please login with ${userExists?.lastLoggedInProvider} instead.`,
            variant: 'error',
          })
          return this.response(ctx).redirect(route('auth_login')).send()
        }

        await this.session.createForUser(ctx, {
          userId: userExists?.id,
        })

        return this.response(ctx).redirect(route('dashboard')).send()
      }

      if (accountExists || userExists) {
        this.flash(ctx, {
          title:
            'A user with this account already exists. Are you trying to login instead ?',
          variant: 'error',
        })
        return this.response(ctx).redirect(route('auth_register')).send()
      }

      const user = await this.userRepository.createWithOauth2Account(response)

      await this.session.createForUser(ctx, {
        userId: user.id,
      })

      return this.response(ctx).redirect(route('auth_register_profile')).send()
    } catch (error) {
      this.flash(ctx, {
        title: `Failed to authenticate with ${params.provider}.`,
        description: 'Please try again or use another authentication method.',
        variant: 'error',
      })
      return this.response(ctx)
        .redirect(route(params.action === 'login' ? 'auth_login' : 'auth_register'))
        .send()
    }
  }

  /**
   * Initiates the OAuth authorization flow with a provider.
   *
   * Redirects the user to the provider's authentication page and sets up
   * the necessary state cookies to validate the callback request.
   * This is the first step in the OAuth authentication process.
   */
  authorize = async (ctx: HonoContext) => {
    const params = ctx.req.param() as Oauth2Params

    const client = this.drivers(ctx)[params.provider]

    const redirectUrl = await client.getRedirectUrl()

    setCookie(ctx, client.OAUTH2_STATE_COOKIE_NAME, client.state, {
      sameSite: 'lax',
    })
    setCookie(ctx, client.OAUTH_2_ACTION_COOKIE_NAME, params.action, {
      sameSite: 'lax',
    })

    return ctx.redirect(redirectUrl)
  }
}
