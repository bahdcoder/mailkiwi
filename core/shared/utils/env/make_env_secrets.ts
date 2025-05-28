import { Secret } from '@poppinss/utils'

export type NODE_ENV_OPTIONS =
  | 'development'
  | 'test'
  | 'production'
  | 'staging'
  | 'test-playwright'

export function makeEnvSecrets<
  T extends {
    APP_KEY?: string
    REDIS_URL?: string
    NODE_ENV?: NODE_ENV_OPTIONS
    MTA_ACCESS_TOKEN?: string
    isProd: boolean
    isDev: boolean
    isTest: boolean
    isProduction: boolean
  },
>(value: T) {
  const { MTA_ACCESS_TOKEN, APP_KEY, REDIS_URL, NODE_ENV } = { ...value }
  return {
    ...value,
    isProd: value.isProd,
    isTest: value.isTest,
    isDev: value.isDev,
    isStaging: NODE_ENV === 'staging',
    isProduction: value.isProduction,
    isProdOrStaging: value.isProd || NODE_ENV === 'staging',
    APP_KEY: APP_KEY ? new Secret(APP_KEY) : undefined,
    REDIS_URL: REDIS_URL ? new Secret(REDIS_URL) : undefined,
    MTA_ACCESS_TOKEN: MTA_ACCESS_TOKEN ? new Secret(MTA_ACCESS_TOKEN) : undefined,
  }
}
