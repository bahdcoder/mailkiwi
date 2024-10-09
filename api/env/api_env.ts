import { cleanEnv, host, port, str } from "envalid"

import { makeEnvSecrets } from "@/shared/utils/env/make_env_secrets.js"
import { makeExtraAppConfigurations } from "@/shared/utils/env/make_extra_app_configurations.js"
import { mysqlDatabaseUrl } from "@/shared/utils/env/make_mysql_database_validator.js"
import { redisDatabaseUrl } from "@/shared/utils/env/make_redis_url_validator.js"

export type ApiEnvVariables = typeof apiEnv

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

const DEFAULT_TRACKING_SUBDOMAIN = "clicks"

const TRACKING_HOST_NAME = "clicks.kbmta.net"

// We will be the first users of our email infrastructure.
// Our SAAS customers will receive emails from support@kibamail.com. The Return-Path for this email will be kb.kibamail.com, and bounces will return to bounces@kb.kibamail.com
// Our inbound email servers will host email for support@kibamail.com, ceo@kibamail.com, hr@kibamail.com etc

// bounces@mail.kbmta.net will receive all bounce reports for all our customers. The meta data in the email headers will know exactly which customer the email belongs to
// All bounces will be fed into kafka and processed at a later time with some low priority background workers.
// But we will track bounces per minute and per hour per customer, and temporarily pause sending for a sender in some scenarios.
// Pausing only pauses the queue of emails for this sender, but continues to receive email via smtp and http api.

const EVENT_TRACKING_DOMAIN = "e.kbmta.net"

const EU_EVENT_TRACKING_DOMAIN = "eu.e.kbmta.net"

export const apiEnv = makeExtraAppConfigurations(
  makeEnvSecrets(
    cleanEnv(process.env, {
      // Http server
      PORT: port(),
      HOST: host(),

      // Encryption & security
      APP_KEY: str(),

      // Environment
      NODE_ENV: str({
        choices: ["development", "test", "production"],
        default: "test",
      }),
      MAILPIT_API_URL: host(),

      // Databases
      REDIS_URL: redisDatabaseUrl(),
      DATABASE_URL: mysqlDatabaseUrl(),

      // MTA SMTP
      SMTP_HOST: host(),
      SMTP_PORT: port(),
      SMTP_USER: str(),
      SMTP_PASS: str(),
      SMTP_MAIL_FROM: str(),

      // MTA auth
      MTA_ACCESS_TOKEN: str(),
      MTA_INJECTOR_URL: host(),

      // Minio file uploads
      FILE_UPLOADS_ACCESS_KEY: str(),
      FILE_UPLOADS_ACCESS_SECRET: str(),
      FILE_UPLOADS_ENDPOINT: host(),
      FILE_UPLOADS_PORT: port(),

      // emails
      EVENT_TRACKING_DOMAIN: str(),
    }),
  ),
  {
    software: {
      shortName: SHORT_NAME,
      teamHeader: `x-${SHORT_NAME}-team-id`,
      bounceHost: BOUNCE_HOST_NAME,
      bounceSubdomain: DEFAULT_BOUNCE_SUBDOMAIN,
      trackingSubdomain: DEFAULT_TRACKING_SUBDOMAIN,
      trackingHostName: TRACKING_HOST_NAME,
    },
  },
)
