import { appEnv } from '#root/core/app/env/app_env.js'
import { Oauth2Client } from '@poppinss/oauth-client/oauth2'
import type {
  Oauth2AccessToken,
  RedirectRequestContract,
} from '@poppinss/oauth-client/types'
import { getCookie } from 'hono/cookie'

import type {
  Oauth2Driver,
  Oauth2Params,
} from '#root/core/auth/oauth2_drivers/base_driver.js'

import { makeHttpClient } from '#root/core/shared/http/http_client.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class GithubDriver
  extends Oauth2Client<Oauth2AccessToken>
  implements Oauth2Driver
{
  OAUTH2_STATE_COOKIE_NAME = 'gh_oauth_state'
  OAUTH_2_ACTION_COOKIE_NAME = 'gh_action'

  state: string

  protected ctx: HonoContext

  constructor() {
    super({
      callbackUrl: appEnv.OAUTH_GITHUB_CALLBACK_URL,
      clientId: appEnv.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: appEnv.OAUTH_GITHUB_CLIENT_SECRET,
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      accessTokenUrl: 'https://github.com/login/oauth/access_token',
    })

    this.state = this.getState()
  }

  setCtx(ctx: HonoContext) {
    this.ctx = ctx

    return this
  }

  /**
   * OPTIONAL
   *
   * Configure the redirect request. Invoked before
   * the user callback
   */
  protected configureRedirectRequest(request: RedirectRequestContract) {
    request.param('state', this.state)
    request.param('scope', 'user:email read:user')
  }

  protected getProviderState() {
    return getCookie(this.ctx, this.OAUTH2_STATE_COOKIE_NAME)
  }

  protected getProviderAction() {
    return getCookie(this.ctx, this.OAUTH_2_ACTION_COOKIE_NAME) as Oauth2Params['action']
  }

  /**
   * OPTIONAL
   *
   * Configure the access token request. Invoked before
   * the user callback
   */
  protected configureAccessTokenRequest(request: RedirectRequestContract) {
    request.param('code', this.ctx.req.param('code'))
    request.param('state', this.getProviderState())
  }

  async handleCallback() {
    const { code, state } = this.ctx.req.query()

    this.verifyState(state, this.getProviderState())

    const accessToken = await this.getAccessToken((request) => {
      request.param('code', code)
      request.param('state', state)
    })

    const githubApiClient = makeHttpClient()
      .baseURL('https://api.github.com')
      .headers({
        Authorization: `Bearer ${accessToken.token}`,
      })

    const [profileData, emailsData] = await Promise.all([
      githubApiClient
        .get()
        .url('/user')
        .asJson()
        .send<{ name: string; login: string; id: number }>(),
      githubApiClient
        .get()
        .url('/user/emails')
        .asJson()
        .send<{ email: string; verified: boolean; primary: boolean }[]>(),
    ])

    const email =
      emailsData.data.find((email) => email.verified && email.primary) ||
      emailsData.data.find((email) => email.verified)

    let [firstName, lastName] = profileData?.data?.name?.split(' ') || []

    if (!firstName) {
      firstName = profileData?.data?.login
    }

    return {
      user: {
        email: email?.email,
        lastName,
        firstName,
        providerId: profileData.data.id.toString(),
      },
      accessToken,
      provider: 'github' as const,
      action: this.getProviderAction(),
    }
  }
}
