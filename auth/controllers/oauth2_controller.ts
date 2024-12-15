import { Oauth2AccessToken } from "@poppinss/oauth-client/types"
import { and, eq } from "drizzle-orm"
import { getCookie, setCookie } from "hono/cookie"

import { GithubDriver } from "@/auth/oauth2_drivers/github_driver.js"
import { GoogleDriver } from "@/auth/oauth2_drivers/google_driver.js"
import { Oauth2AccountsRepository } from "@/auth/users/repositories/oauth2_accounts_repository.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { UserWithTeams } from "@/database/database_schema_types.js"
import { oauth2Accounts } from "@/database/schema.js"

import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

type Oauth2Params = {
  action: "login" | "register"
  provider: "github" | "google"
}

export class Oauth2Controller extends VikeController {
  constructor(
    protected app = makeApp(),
    protected userRepository = container.make(UserRepository),
    protected oauth2AccountsRepository = container.make(Oauth2AccountsRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/:action/oauth2/:provider/authorize", this.authorize],

        // callback
        ["GET", "/oauth2/:provider/callback", this.callback],
      ],
      {
        prefix: "auth",
        middleware: [],
      },
    )
  }

  protected drivers(ctx: HonoContext) {
    return {
      github: container.make(GithubDriver).setCtx(ctx),
      google: container.make(GoogleDriver).setCtx(ctx),
    } as const
  }

  protected OAUTH_2_ACTION_COOKIE_NAME = "oauth2_action"

  callback = async (ctx: HonoContext) => {
    const params = ctx.req.param() as Oauth2Params

    const client = this.drivers(ctx)[params.provider]

    try {
      const response = await client.handleCallback()

      if (!response.user?.email) {
        return this.response(ctx)
          .redirect(
            route(
              params.action === "login" ? "auth_login" : "auth_register",
              {},
              {
                error: `We coudn't find a verified email on your ${params.provider} account. Please try again or use another authentication method.`,
              },
            ),
          )
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

      if (response.action === "login") {
        if (!accountExists || !userExists) {
          return this.response(ctx)
            .redirect(
              route(
                "auth_login",
                {},
                {
                  error: `We could not find a user with this ${params.provider} account. Please register a new account if you haven't done so before.`,
                },
              ),
            )
            .send()
        }

        // TODO: Allow account linking here by creating a unique session, and asking user to confirm linking by providing their password. Here's now it will work:

        // 1. Store new account into database with confirmed: false
        // 2. Create a cookie with the account id, userId and redirect user to a page to confirm password to link account.
        // 3. On submit of that page, get account id and user id from session. compare user password to see if correct.
        // 4. if eveyrthing is good, mark account as confirmed: true, create user session, and redirect user to dashboard.

        // Create a temporary session for the user by setting a cookie with
        if (userExists && !accountExists) {
          return this.response(ctx)
            .redirect(
              route(
                "auth_login",
                {},
                {
                  error: `We found your account, but you previously logged in using ${userExists?.lastLoggedInProvider}. Please login with ${userExists?.lastLoggedInProvider} instead.`,
                },
              ),
            )
            .send()
        }

        await this.session.createForUser(ctx, {
          userId: userExists?.id,
        })

        return this.response(ctx).redirect(route("dashboard")).send()
      }

      // user is trying to register an account
      if (accountExists || userExists) {
        return this.response(ctx)
          .redirect(
            route(
              "auth_register",
              {},
              {
                error: `A user with this account already exists. Are you trying to login instead ?`,
              },
            ),
          )
          .send()
      }

      const user = await this.userRepository.createWithOauth2Account(response)

      await this.session.createForUser(ctx, {
        userId: user.id,
      })

      return this.response(ctx).redirect(route("auth_register_profile")).send()
    } catch (error) {
      d({ error })
      return this.response(ctx)
        .redirect(
          route(
            params.action === "login" ? "auth_login" : "auth_register",
            {},
            {
              error: `Failed to authenticate with ${params.provider}. Please try again or use another authentication method.`,
            },
          ),
        )
        .send()
    }
  }

  authorize = async (ctx: HonoContext) => {
    const params = ctx.req.param() as Oauth2Params

    const client = this.drivers(ctx)[params.provider]

    const redirectUrl = await client.getRedirectUrl()

    setCookie(ctx, client.OAUTH2_STATE_COOKIE_NAME, client.state, {
      sameSite: "lax",
    })
    setCookie(ctx, client.OAUTH_2_ACTION_COOKIE_NAME, params.action, { sameSite: "lax" })

    return ctx.redirect(redirectUrl)
  }
}
