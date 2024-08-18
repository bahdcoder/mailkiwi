import { Secret } from '@poppinss/utils'
import {
  url,
  ip,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  safeParse,
  string,
  number,
} from 'valibot'

export type EnvVariables = {
  PORT: number
  HOST: string
  APP_KEY: Secret<string>
  APP_URL: string
  DATABASE_URL: string
  CLICKHOUSE_DATABASE_URL: string
  REDIS_URL: string
  NODE_ENV: 'development' | 'test' | 'production'

  isTest: boolean
  isProd: boolean
  isDev: boolean

  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_USER: string
  SMTP_PASS: string
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
  CLICKHOUSE_DATABASE_URL: pipe(string(), nonEmpty()),
  REDIS_URL: pipe(string(), nonEmpty()),
  DATABASE_URL: pipe(string(), nonEmpty()),
  NODE_ENV: picklist(['development', 'test', 'production']),
  SMTP_HOST: pipe(string(), nonEmpty()),
  SMTP_PORT: number(),
  SMTP_USER: pipe(string(), nonEmpty()),
  SMTP_PASS: pipe(string(), nonEmpty()),
})

const parsed = safeParse(envValidationSchema, {
  ...process.env,
  SMTP_PORT: Number.parseInt(process.env.SMTP_PORT ?? ''),
})

if (!parsed.success) {
  console.dir({
    '🟡 ENVIRONMENT_VARIABLES_VALIDATION_FAILED': parsed.issues.map((issue) => [
      issue?.path?.[0]?.key,
      issue?.message,
    ]),
  })
}

const parsedOutput = parsed.output as Omit<EnvVariables, 'APP_KEY'> & {
  APP_KEY: string
}

export const env = {
  ...parsedOutput,
  APP_KEY: new Secret(parsedOutput.APP_KEY as string),
} as EnvVariables

env.isTest = env.NODE_ENV === 'test'
env.isProd = env.NODE_ENV === 'production'
env.isDev = env.NODE_ENV === 'development'

const SHORT_NAME = 'kibamail'

export const config = {
  ...env,
  software: { shortName: SHORT_NAME, teamHeader: `x-${SHORT_NAME}-team-id` },
}
