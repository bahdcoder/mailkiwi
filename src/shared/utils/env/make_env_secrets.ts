import { Secret } from "@poppinss/utils"

export function makeEnvSecrets<
  T extends {
    APP_KEY?: string
    REDIS_URL?: string
    MTA_ACCESS_TOKEN?: string
    isProd: boolean
    isDev: boolean
    isTest: boolean
    isProduction: boolean
  },
>(value: T) {
  const { MTA_ACCESS_TOKEN, APP_KEY, REDIS_URL } = { ...value }
  return {
    ...value,
    isProd: value.isProd,
    isTest: value.isTest,
    isDev: value.isDev,
    isProduction: value.isProduction,
    APP_KEY: APP_KEY ? new Secret(APP_KEY) : undefined,
    REDIS_URL: REDIS_URL ? new Secret(REDIS_URL) : undefined,
    MTA_ACCESS_TOKEN: MTA_ACCESS_TOKEN
      ? new Secret(MTA_ACCESS_TOKEN)
      : undefined,
  }
}
