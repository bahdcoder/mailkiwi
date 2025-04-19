import type { Oauth2AccessToken } from '@poppinss/oauth-client/types'

export type Oauth2Params = {
  action: 'login' | 'register'
  provider: 'github' | 'google'
}

export interface Oauth2UserResponse {
  email: string | undefined
  firstName: string
  lastName: string
  providerId: string
}

export interface Oauth2Response {
  user: Oauth2UserResponse
  provider: Oauth2Params['provider']
  action: Oauth2Params['action']
  accessToken: Oauth2AccessToken
}

export interface Oauth2Driver {
  OAUTH2_STATE_COOKIE_NAME: string
  OAUTH_2_ACTION_COOKIE_NAME: string
  handleCallback: () => Promise<Oauth2Response>
}
