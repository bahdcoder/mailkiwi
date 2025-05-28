import { appEnv } from '#root/core/app/env/app_env.js'
import { Oauth2Client } from '@poppinss/oauth-client/oauth2'
import type {
  Oauth2AccessToken,
  RedirectRequestContract,
} from '@poppinss/oauth-client/types'
import { getCookie } from 'hono/cookie'
import { decode } from 'hono/jwt'
import type { JWTPayload } from 'hono/utils/jwt/types'
import type { JwtHeader } from 'jsonwebtoken'

import type {
  Oauth2Driver,
  Oauth2Params,
} from '#root/core/auth/oauth2_drivers/base_driver.js'

import { makeHttpClient } from '#root/core/shared/http/http_client.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class GoogleDriver
  extends Oauth2Client<Oauth2AccessToken>
  implements Oauth2Driver
{
  OAUTH2_STATE_COOKIE_NAME = 'google_oauth_state'
  OAUTH_2_ACTION_COOKIE_NAME = 'google_action'

  state: string
  protected ctx: HonoContext

  constructor() {
    super({
      callbackUrl: appEnv.OAUTH_GOOGLE_CALLBACK_URL,
      clientId: appEnv.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: appEnv.OAUTH_GOOGLE_CLIENT_SECRET,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      accessTokenUrl: 'https://oauth2.googleapis.com/token',
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
    request.param('response_type', 'code')
    request.param('access_type', 'offline')
    request.param('prompt', 'select_account')
    request.param(
      'scope',
      'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    )
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
    })

    const { payload: userInfo } = decode(accessToken?.id_token) as {
      header: JwtHeader
      payload: JWTPayload & {
        email: string
        name: string
        picture: string
        given_name: string
        family_name: string
        email_verified: boolean
        sub: string
      }
    }

    return {
      user: {
        email: userInfo?.email_verified ? userInfo.email : '',
        lastName: userInfo.family_name,
        firstName: userInfo.given_name,
        providerId: userInfo.sub,
      },
      accessToken,
      provider: 'google' as const,
      action: this.getProviderAction(),
    }
  }
}
