// import "dotenv/config"

import { Secret } from '@poppinss/utils'
import { cleanEnv, host, makeValidator, num, str } from 'envalid'

export type EnvVariables = typeof env
export type ConfigVariables = typeof config

const appKey = makeValidator((value) => {
  if (value.length !== 32) {
    throw new Error('APP_KEY must be 32 characters long.')
  }

  return new Secret(value)
})

export const env = cleanEnv(process.env, {
  PORT: num({ default: 5566 }),
  HOST: host({ default: '0.0.0.0' }),
  APP_KEY: appKey({ desc: 'Application key.' }),
  DATABASE_URL: str({ default: 'dev.db' }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
})

const SHORT_NAME = 'bamboomailer'

export const config = {
  ...env,
  software: { shortName: SHORT_NAME, teamHeader: `x-${SHORT_NAME}-team-id` },
}
