import { Secret } from "@poppinss/utils"
import {
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
  url,
} from "valibot"

export type EnvVariables = {
  PORT: number
  MTA_AUTHENTICATOR_PORT: number
  MTA_LOG_PROCESSOR_PORT: number
  HOST: string
  APP_KEY: Secret<string>
  APP_URL: string
  DATABASE_URL: string
  CLICKHOUSE_DATABASE_URL: string
  REDIS_URL: string
  NODE_ENV: "development" | "test" | "production"

  isTest: boolean
  isProd: boolean
  isDev: boolean

  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_MAIL_FROM: string

  SECRETS_STORE_URL: string
  SECRETS_STORE_TOKEN: string

  FILE_UPLOADS_ACCESS_KEY: string
  FILE_UPLOADS_ACCESS_SECRET: string
  FILE_UPLOADS_ENDPOINT: string
  FILE_UPLOADS_PORT: string

  MTA_ACCESS_TOKEN: Secret<string>
}

export type ConfigVariables = typeof config

const DEFAULT_PORT = parseInt("5566")

const envValidationSchema = object({
  PORT: optional(string(), DEFAULT_PORT.toString()),
  MTA_AUTHENTICATOR_PORT: optional(
    string(),
    (DEFAULT_PORT + 1).toString(),
  ),
  MTA_LOG_PROCESSOR_PORT: optional(
    string(),
    (DEFAULT_PORT + 2).toString(),
  ),
  HOST: pipe(
    optional(string(), `http://127.0.0.1:${DEFAULT_PORT}`),
    nonEmpty(),
    ip(),
  ),
  APP_KEY: pipe(string(), nonEmpty(), minLength(32), maxLength(32)),
  APP_URL: pipe(
    optional(string(), `http://127.0.0.1:${DEFAULT_PORT}`),
    nonEmpty(),
    url(),
  ),
  SECRETS_STORE_URL: pipe(string(), nonEmpty()),
  SECRETS_STORE_TOKEN: pipe(string(), nonEmpty()),
  CLICKHOUSE_DATABASE_URL: pipe(string(), nonEmpty()),
  REDIS_URL: pipe(string(), nonEmpty()),
  DATABASE_URL: pipe(string(), nonEmpty()),
  NODE_ENV: picklist(["development", "test", "production"]),
  SMTP_HOST: pipe(string(), nonEmpty()),
  SMTP_PORT: number(),
  SMTP_USER: pipe(string(), nonEmpty()),
  SMTP_PASS: pipe(string(), nonEmpty()),
  SMTP_MAIL_FROM: pipe(string(), nonEmpty()),

  MTA_ACCESS_TOKEN: pipe(string(), nonEmpty()),

  FILE_UPLOADS_ACCESS_KEY: pipe(string(), nonEmpty()),
  FILE_UPLOADS_ACCESS_SECRET: pipe(string(), nonEmpty()),
  FILE_UPLOADS_ENDPOINT: pipe(string(), nonEmpty()),
  FILE_UPLOADS_PORT: pipe(string(), nonEmpty()),
})

const parsed = safeParse(envValidationSchema, {
  ...process.env,
  SMTP_PORT: Number.parseInt(process.env.SMTP_PORT ?? ""),
})

if (!parsed.success) {
  console.dir({
    "🟡 ENVIRONMENT_VARIABLES_VALIDATION_FAILED": parsed.issues.map(
      (issue) => [issue?.path?.[0]?.key, issue?.message],
    ),
  })
}

const parsedOutput = parsed.output as Omit<
  EnvVariables,
  "APP_KEY" | "MTA_ACCESS_TOKEN"
> & {
  APP_KEY: string
  MTA_ACCESS_TOKEN: string
}

export const env = {
  ...parsedOutput,
  APP_KEY: new Secret(parsedOutput.APP_KEY),
  MTA_ACCESS_TOKEN: new Secret(parsedOutput.MTA_ACCESS_TOKEN),
} as EnvVariables

env.isTest = env.NODE_ENV === "test"
env.isProd = env.NODE_ENV === "production"
env.isDev = env.NODE_ENV === "development"

const SHORT_NAME = "kibamail"

// This is where we host the bounce processing server.
// All incoming bounces and complaints from our customers will go through here.
// They eventually get fed into a kafka topic that multiple services will consume.

// The SPF configuration for this domain must point to (include) spf.kbmta.net, which further includes all our sending subnets and ip addresses.
const BOUNCE_HOST_NAME = "mail.kbmta.net"

// This is where we host the SPF DNS entry.
// All our subnets and IP addresses for email sending must be configured as a TXT record on this domain.
// All our domains like mail.kbmta.net, kb-mkg.kbmta.net, kibamail.com etc. must include this domain in its SPF record.
const SPF_HOST_NAME = "spf.kbmta.net"

// This is where we host the transactional email server.
// All inbound transactional emails will go through here, including those sent via HTTP api.
const SMTP_HOST_NAME = "smtp.kbmta.net"

// This is where we host the marketing email server.
// All inbound marketing emails will go through here, including those sent via HTTP api.
const SMTP_MARKETING_HOST_NAME = "smtp-mkg.kbmta.net"

// This is the default subdomain customers will use when configuring the `Return-Path` DNS entry.
// Example: Google uses our infrastructure to send emails, so they'll configure the following dns entry:
// kb.google.com. IN CNAME mail.kbmta.net
const DEFAULT_BOUNCE_SUBDOMAIN = "kb"

// We will be the first users of our email infrastructure.
// Our SAAS customers will receive emails from support@kibamail.com. The Return-Path for this email will be kb.kibamail.com, and bounces will return to bounces@kb.kibamail.com
// Our inbound email servers will host email for support@kibamail.com, ceo@kibamail.com, hr@kibamail.com etc

// bounces@mail.kbmta.net will receive all bounce reports for all our customers. The meta data in the email headers will know exactly which customer the email belongs to
// All bounces will be fed into kafka and processed at a later time with some low priority background workers.
// But we will track bounces per minute and per hour per customer, and temporarily pause sending for a sender in some scenarios.
// Pausing only pauses the queue of emails for this sender, but continues to receive email via smtp and http api.

const EVENT_TRACKING_DOMAIN = "e.kbmta.net"

const EU_EVENT_TRACKING_DOMAIN = "eu.e.kbmta.net"

export const config = {
  ...env,
  software: {
    shortName: SHORT_NAME,
    teamHeader: `x-${SHORT_NAME}-team-id`,
    bounceHost: BOUNCE_HOST_NAME,
    bounceSubdomain: DEFAULT_BOUNCE_SUBDOMAIN,
  },
}
