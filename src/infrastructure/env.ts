import {
  url,
  ip,
  maxLength,
  minLength,
  nonEmpty,
  number,
  object,
  optional,
  picklist,
  pipe,
  safeParse,
  string,
} from 'valibot'

export type EnvVariables = {
  PORT: number
  HOST: string
  APP_KEY: string
  DATABASE_URL: string
  NODE_ENV: 'development' | 'test' | 'production'
  MAILHOG_URL: string
  isTest: boolean
  isProd: boolean
  isDev: boolean
}

export type ConfigVariables = typeof config

const DEFAULT_PORT = '5566'

const envValidationSchema = object({
  PORT: optional(string(), DEFAULT_PORT),
  HOST: pipe(
    optional(string(), `http://localhost:${DEFAULT_PORT}`),
    nonEmpty(),
    ip(),
  ),
  APP_KEY: pipe(string(), nonEmpty(), minLength(32), maxLength(32)),
  APP_URL: pipe(
    optional(string(), `http://localhost:${DEFAULT_PORT}`),
    nonEmpty(),
    url(),
  ),
  DATABASE_URL: pipe(string(), nonEmpty()),
  NODE_ENV: picklist(['development', 'test', 'production']),
  MAILHOG_URL: pipe(string(), nonEmpty(), url()),
})

const parsed = safeParse(envValidationSchema, process.env)

if (!parsed.success) {
  console.dir({
    '🟡 ENVIRONMENT_VARIABLES_VALIDATION_FAILED': parsed.issues,
  })
}

export const env = parsed.output as EnvVariables

env.isTest = env.NODE_ENV === 'test'
env.isProd = env.NODE_ENV === 'production'
env.isDev = env.NODE_ENV === 'development'

const SHORT_NAME = 'bamboomailer'

export const config = {
  ...env,
  software: { shortName: SHORT_NAME, teamHeader: `x-${SHORT_NAME}-team-id` },
}
