import { str } from 'envalid'

import { makeAppEnv } from '@kibamail/framework'

export type AppEnvVariables = typeof appEnv

export const SHORT_NAME = 'kibamail'

export const FREE_MONTHLY_CREDITS = 10_000

// This is where we host the bounce processing server.
// All incoming bounces and complaints from our customers will go through here.
// They eventually get fed into a kafka topic that multiple services will consume.

// The SPF configuration for this domain must point to (include) spf.kbmta.net, which further includes all our sending subnets and ip addresses.
export const BOUNCE_HOST_NAME = 'mail.kbmta.net'

// This is where we host the SPF DNS entry.
// All our subnets and IP addresses for email sending must be configured as a TXT record on this domain.
// All our domains like mail.kbmta.net, kb-mkg.kbmta.net, kibamail.com etc. must include this domain in its SPF record.
export const SPF_HOST_NAME = 'spf.kbmta.net'

// This is where we host the transactional email server.
// All inbound transactional emails will go through here, including those sent via HTTP api.
export const SMTP_HOST_NAME = 'send.kbmta.net'

// This is where we host the marketing email server.
// All inbound marketing emails will go through here, including those sent via HTTP api.
export const SMTP_MARKETING_HOST_NAME = 'engage.kbmta.net'

// This is the main domain of all newsletters on the platform.
// Customers will get a subdomain on this domain.
// For example, fastmedia.kibasites.com.
export const WEBSITES_DOMAIN = 'kibasites.com'

export const WEBSITES_PATH = '__websites'

export const COMMERCE_WEBSITE_DOMAIN = WEBSITES_DOMAIN

// This is the default subdomain customers will use when configuring the `Return-Path` DNS entry.
// Example: Google uses our infrastructure to send emails, so they'll configure the following dns entry:
// kb.google.com. IN CNAME mail.kbmta.net
const DEFAULT_BOUNCE_SUBDOMAIN = 'kb'

const DEFAULT_TRACKING_SUBDOMAIN = 'clicks'

const TRACKING_HOST_NAME = 'clicks.kbmta.net'

// We will be the first users of our email infrastructure.
// Our SAAS customers will receive emails from support@kibamail.com. The Return-Path for this email will be kb.kibamail.com, and bounces will return to bounces@kb.kibamail.com
// Our inbound email servers will host email for support@kibamail.com, ceo@kibamail.com, hr@kibamail.com etc

// bounces@mail.kbmta.net will receive all bounce reports for all our customers. The meta data in the email headers will know exactly which customer the email belongs to
// All bounces will be fed into kafka and processed at a later time with some low priority background workers.
// But we will track bounces per minute and per hour per customer, and temporarily pause sending for a sender in some scenarios.
// Pausing only pauses the queue of emails for this sender, but continues to receive email via smtp and http api.

// const EVENT_TRACKING_DOMAIN = 'e.kbmta.net'

// const EU_EVENT_TRACKING_DOMAIN = 'eu.e.kbmta.net'

export const appEnv = makeAppEnv(
  {
    MAILPIT_API_URL: str(),

    MTA_ACCESS_TOKEN: str(),
    MTA_INJECTOR_URL: str(),

    EVENT_TRACKING_DOMAIN: str(),

    MMDB_DOWNLOAD_URL: str(),

    ACME_DIRECTORY_URL: str(),

    COMMERCE_PROVIDER_STRIPE_SECRET_KEY: str(),
    COMMERCE_PROVIDER_STRIPE_PUBLIC_KEY: str(),

    COMMERCE_PROVIDER_PAYSTACK_SECRET_KEY: str(),
    COMMERCE_PROVIDER_PAYSTACK_PUBLIC_KEY: str(),

    GOOGLE_FONTS_API_KEY: str(),
  },
  {
    software: {
      shortName: SHORT_NAME,
      teamHeader: `x-${SHORT_NAME}-team-id`,
      bounceHost: BOUNCE_HOST_NAME,
      bounceSubdomain: DEFAULT_BOUNCE_SUBDOMAIN,
      trackingSubdomain: DEFAULT_TRACKING_SUBDOMAIN,
      trackingHostName: TRACKING_HOST_NAME,
    },
    emailHeaders: {
      messageId: 'X-Kibamail-Message-ID',
      contactId: 'X-Kibamail-Contact-ID',
      emailSendId: 'X-Kibamail-EmailSend-ID',
      broadcastId: 'X-Kibamail-Broadcast-ID',
      audienceId: 'X-Kibamail-Audience-ID',
      sendingDomainId: 'X-Kibamail-Sending-Domain-ID',
    },
  },
)
