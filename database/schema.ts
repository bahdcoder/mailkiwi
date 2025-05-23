import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'
import type { CreateFormDto } from '#root/core/forms/dto/create_form_dto.js'
import type { SubmitFormDto } from '#root/core/forms/dto/submit_form_dto.js'
import type { UpdateWebsitePageDto } from '#root/core/websites/dto/update_website_page_dto.js'
import { relations, sql } from 'drizzle-orm'
import {
  type AnyMySqlColumn,
  boolean,
  customType,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'
import { v1 } from 'uuid'

/**
 * Mapping of automation trigger types used throughout the system.
 *
 * These constants define the available trigger types that can start an automation workflow:
 * - TRIGGER_EMPTY: A placeholder trigger used for manual testing or template automations
 * - TRIGGER_CONTACT_SUBSCRIBED: Triggered when a contact subscribes to an audience
 * - TRIGGER_CONTACT_UNSUBSCRIBED: Triggered when a contact unsubscribes from an audience
 * - TRIGGER_CONTACT_TAG_ADDED: Triggered when a tag is added to a contact
 * - TRIGGER_CONTACT_TAG_REMOVED: Triggered when a tag is removed from a contact
 * - TRIGGER_API_MANUAL: Triggered via API call for external system integration
 *
 * These trigger types are used in the automation system to determine when to start
 * a workflow for a contact. Each trigger type corresponds to a specific event in the
 * system that can initiate an automation sequence.
 */
export const automationStepSubtypesTriggerMap = {
  TRIGGER_EMPTY: 'TRIGGER_EMPTY',
  TRIGGER_CONTACT_SUBSCRIBED: 'TRIGGER_CONTACT_SUBSCRIBED',
  TRIGGER_CONTACT_UNSUBSCRIBED: 'TRIGGER_CONTACT_UNSUBSCRIBED',
  TRIGGER_CONTACT_TAG_ADDED: 'TRIGGER_CONTACT_TAG_ADDED',
  TRIGGER_CONTACT_TAG_REMOVED: 'TRIGGER_CONTACT_TAG_REMOVED',
  TRIGGER_API_MANUAL: 'TRIGGER_API_MANUAL',
} as const

export const automationStepSubtypesTrigger = [
  automationStepSubtypesTriggerMap.TRIGGER_EMPTY,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_SUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_UNSUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_ADDED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_REMOVED,
  automationStepSubtypesTriggerMap.TRIGGER_API_MANUAL,
] as const

export const automationStepSubtypesAction = [
  'ACTION_EMPTY',
  'ACTION_SEND_EMAIL',
  'ACTION_ADD_TAG',
  'ACTION_REMOVE_TAG',
  'ACTION_SUBSCRIBE_TO_AUDIENCE',
  'ACTION_UNSUBSCRIBE_FROM_AUDIENCE',
  'ACTION_UPDATE_CONTACT_ATTRIBUTES',
] as const

export const automationStepSubtypesRule = [
  'RULE_IF_ELSE',
  'RULE_WAIT_FOR_DURATION',
  'RULE_PERCENTAGE_SPLIT',
  'RULE_WAIT_FOR_TRIGGER',
] as const

export const automationStepSubtypesEnd = ['END'] as const

export const automationStepTypes = ['TRIGGER', 'ACTION', 'RULE', 'END'] as const
export const automationStepSubtypes = [
  ...automationStepSubtypesTrigger,
  ...automationStepSubtypesAction,
  ...automationStepSubtypesRule,
  ...automationStepSubtypesEnd,
] as const

/**
 * Custom type for efficiently storing UUIDs in MySQL.
 *
 * This custom type implementation optimizes UUID storage by using MySQL's binary type
 * instead of storing UUIDs as strings. Key benefits include:
 *
 * 1. Reduced storage space: 16 bytes for binary vs 36 bytes for string UUIDs
 * 2. Improved query performance: Binary comparisons are faster than string comparisons
 * 3. Proper indexing: Binary UUIDs can be efficiently indexed
 *
 * The implementation handles conversion between string UUIDs (used in application code)
 * and binary UUIDs (stored in the database) transparently. It uses MySQL's UUID_TO_BIN
 * function with time-based ordering (swapping time-low and time-high components) to
 * improve index efficiency for time-based UUIDs.
 *
 * This is particularly important for Kibamail's performance as UUIDs are used as primary
 * keys throughout the database schema.
 */
export const binaryUuid = customType<{
  data: string
  driverData: Buffer
  config: { length?: number }
}>({
  dataType(config) {
    return typeof config?.length !== 'undefined' ? `binary(${config.length})` : 'binary'
  },
  fromDriver(buf) {
    // Convert binary UUID back to string format with proper byte ordering
    return [
      buf.toString('hex', 4, 8), // time-low
      buf.toString('hex', 2, 4), // time-mid
      buf.toString('hex', 0, 2), // time-high-and-version
      buf.toString('hex', 8, 10), // clock-seq-and-reserved + clock-seq-low
      buf.toString('hex', 10, 16), // node
    ].join('-')
  },
  toDriver(value: string) {
    // Convert string UUID to optimized binary format
    return uuidToBin(value)
  },
})

export const uuidToBin = (uuid: string) => sql`UUID_TO_BIN(${uuid}, 1)`

const primaryKeyCuid = <TName extends string>(name: TName) =>
  binaryUuid(name, { length: 16 })

const id = primaryKeyCuid('id').primaryKey().$defaultFn(v1)

export type ContactFilterCondition = {
  field: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['field']
  operation: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['operation']
  value: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['value']
}

export type ContactFilterGroup = {
  type: 'AND' | 'OR'
  conditions: ContactFilterCondition[]
}

export type ContactFilterGroups = {
  type: 'AND' | 'OR'
  groups: ContactFilterGroup[]
}

export type KnownAudienceProperty = {
  id: string
  label: string
  description?: string
  options?: string[]

  // If a contact can update, on their preferences / settings screen, they can mark this property as true / false for a boolean field, Or Type in a value for a text field.

  // Example use case: Weekly newsletter -> false
  // Example use case: Cyber Monday Sale -> false

  archived?: boolean
  default?: boolean | string | number
  canContactUpdate?: boolean
  type: 'boolean' | 'float' | 'date' | 'text'
}

export const settings = mysqlTable('settings', {
  id,
  // encrypted id used by acme client for generating acme certificates.
  acmeAccountIdentity: text('acmeAccountIdentity').notNull(),
})

export const users = mysqlTable('users', {
  id,
  email: varchar('email', { length: 80 }).unique().notNull(),
  unconfirmedEmail: varchar('unconfirmedEmail', { length: 80 }),
  firstName: varchar('firstName', { length: 80 }),
  lastName: varchar('lastName', { length: 80 }),
  avatarUrl: varchar('avatarUrl', { length: 256 }),
  password: varchar('password', { length: 256 }),
  emailVerificationCode: varchar('emailVerificationCode', { length: 256 }),
  emailVerifiedAt: timestamp('emailVerifiedAt'),
  emailVerificationCodeExpiresAt: timestamp('emailVerificationCodeExpiresAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  role: mysqlEnum('role', ['customer', 'support', 'team']).$default(() => 'customer'),
  lastLoggedInAt: timestamp('lastLoggedInAt'),
  lastPasswordResetAt: timestamp('lastPasswordResetAt'),
  lastLoggedInProvider: mysqlEnum('lastLoggedInProvider', [
    'password',
    'github',
    'google',
  ]),
})

export const oauth2Accounts = mysqlTable(
  'oauth2Accounts',
  {
    id,
    userId: primaryKeyCuid('userId')
      .references(() => users.id)
      .notNull(),
    provider: mysqlEnum('provider', ['github', 'google']).notNull(),
    providerId: varchar('providerId', { length: 80 }).unique().notNull(),
    accessToken: text('accessToken').notNull(),
    // refreshToken: text('refreshToken'),
  },
  (table) => ({
    Oauth2AccountProviderUserId: unique('Oauth2AccountProviderUserIdKey').on(
      table.userId,
      table.provider,
    ),
  }),
)

export const passwordResets = mysqlTable('passwordResets', {
  id,
  userId: primaryKeyCuid('userId')
    .references(() => users.id)
    .unique()
    .notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  usedAt: timestamp('usedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const sendingSources = mysqlTable('sendingSources', {
  id,
  status: mysqlEnum('status', ['inactive', 'active', 'warming']).$default(
    () => 'inactive',
  ),
  address: varchar('address', { length: 80 }).notNull().unique(),
  ehloDomain: varchar('ehloDomain', { length: 80 }).notNull().unique(),
  proxyServer: varchar('proxyServer', { length: 80 }),
  addressIpv6: varchar('addressIpv6', { length: 120 }).unique(),
  pool: mysqlEnum('pool', ['engage', 'send']).notNull(),
})

export const accessTokens = mysqlTable('accessTokens', {
  id,
  userId: primaryKeyCuid('userId').references(() => users.id),
  teamId: primaryKeyCuid('teamId').references(() => teams.id),
  name: varchar('name', { length: 32 }),
  accessKey: varchar('accessKey', { length: 255 }),
  capabilities: json('capabilities').$type<string[]>(),
  accessSecret: varchar('accessSecret', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastUsedAt: timestamp('lastUsedAt').defaultNow().notNull(),
  expiresAt: timestamp('expiresAt').defaultNow().notNull(),
})

/**
 * Teams table - Core entity for multi-tenant functionality.
 *
 * The teams table implements Kibamail's multi-tenant architecture, allowing the system
 * to support multiple organizations with isolated data and configurations. Each team:
 *
 * - Represents a distinct organization or business unit
 * - Has its own contacts, audiences, broadcasts, and other resources
 * - Can have multiple team members with different permission levels
 * - Maintains separate tracking and configuration settings
 * - Can integrate with different commerce providers for billing
 *
 * Teams are the foundation of Kibamail's permission system, as all resources
 * are associated with a team, and users access resources through team memberships.
 */
export const teams = mysqlTable('teams', {
  id,
  name: varchar('name', { length: 100 }).notNull(),
  // Owner of the team (typically the user who created it)
  userId: primaryKeyCuid('userId')
    .notNull()
    .references(() => users.id),
  // Team-level tracking settings (can be overridden at the sending domain level)
  trackClicks: boolean('trackClicks'),
  trackOpens: boolean('trackOpens'),
  // Email editor preference for the team
  broadcastEditor: mysqlEnum('broadcastEditor', ['DEFAULT', 'MARKDOWN']),
  // E-commerce integration settings for monetization features
  commerceProvider: mysqlEnum('commerceProvider', ['stripe', 'paystack', 'flutterwave']),
  commerceProviderAccountId: varchar('commerceProviderAccountId', {
    length: 255,
  }),
  commerceProviderConfirmedAt: timestamp('commerceProviderConfirmedAt'),
})

/**
 * SendingDomains table - Manages email sending infrastructure configuration.
 *
 * This table is a critical component of Kibamail's email deliverability system, storing
 * all the configuration needed for proper email authentication and tracking. Each sending domain:
 *
 * - Represents a verified domain used for sending emails
 * - Contains DKIM cryptographic keys for email authentication
 * - Configures return path (bounce handling) settings
 * - Manages tracking domain configuration for analytics
 * - Associates with specific IP addresses for sending
 * - Separates transactional and marketing email configurations
 *
 * The sending domain configuration directly impacts email deliverability, as proper
 * authentication (DKIM, SPF via return path) is essential for avoiding spam filters.
 * The system maintains separate configurations for marketing ('engage') and transactional ('send')
 * emails to optimize deliverability for each type.
 */
export const sendingDomains = mysqlTable('sendingDomains', {
  id,
  name: varchar('name', { length: 100 }).notNull(),
  teamId: primaryKeyCuid('teamId')
    .notNull()
    .references(() => teams.id),

  // DKIM (DomainKeys Identified Mail) authentication configuration
  // This cryptographic authentication is critical for deliverability
  dkimSubDomain: varchar('dkimSubDomain', {
    length: 120,
  }).notNull(),
  dkimPublicKey: text('dkimPublicKey').notNull(),
  dkimPrivateKey: text('dkimPrivateKey').notNull(),
  dkimVerifiedAt: timestamp('dkimVerifiedAt'),

  // Return path configuration for bounce handling and SPF authentication
  // This subdomain receives bounce notifications and implements SPF
  returnPathSubDomain: varchar('returnPathSubDomain', {
    length: 120,
  }).notNull(),
  returnPathDomainCnameValue: varchar('returnPathDomainCnameValue', {
    length: 120,
  }).notNull(),
  returnPathDomainVerifiedAt: timestamp('returnPathDomainVerifiedAt'),

  // Transactional email sending sources (primary and secondary/fallback)
  // Used for sending individual transactional emails ('send' product)
  sendingSourceId: primaryKeyCuid('sendingSourceId').references(() => sendingSources.id),
  secondarySendingSourceId: primaryKeyCuid('secondarySendingSourceId').references(
    () => sendingSources.id,
  ),

  // Marketing email sending sources (primary and secondary/fallback)
  // Used for sending bulk marketing campaigns ('engage' product)
  engageSendingSourceId: primaryKeyCuid('engageSendingSourceId').references(
    () => sendingSources.id,
  ),
  engageSecSendingSourceId: primaryKeyCuid('engageSecSendingSourceId').references(
    () => sendingSources.id,
  ),

  // Tracking domain configuration for open/click analytics
  // This subdomain handles redirects for click tracking and pixel loading for open tracking
  trackingDomainCnameValue: varchar('trackingDomainCnameValue', {
    length: 120,
  }).notNull(),
  trackingSubDomain: varchar('trackingSubDomain', {
    length: 120,
  }).notNull(),

  // Verification timestamps for tracking domain setup
  trackingDomainVerifiedAt: timestamp('trackingDomainVerifiedAt'),
  trackingDomainSslVerifiedAt: timestamp('trackingDomainSslVerifiedAt'),

  // SSL certificate for secure tracking (HTTPS)
  trackingSslCertKey: text('trackingSslCertKey'),
  trackingSslCertSecret: text('trackingSslCertSecret'),

  // Tracking feature toggles (can override team-level settings)
  openTrackingEnabled: boolean('openTrackingEnabled').default(false),
  clickTrackingEnabled: boolean('clickTrackingEnabled').default(false),

  // Domain purpose - separates marketing and transactional email infrastructure
  // This separation improves deliverability by isolating different email types
  product: mysqlEnum('product', ['engage', 'send']).default('engage'),
})

export const webhooks = mysqlTable('webhooks', {
  id,
  name: varchar('name', { length: 50 }).notNull(),
  url: varchar('url', { length: 256 }).notNull(),
  events: mysqlEnum('webhookEvent', [
    'ALL_EVENTS',
    'CONTACT_ADDED',
    'CONTACT_REMOVED',
    'CONTACT_TAG_ADDED',
    'CONTACT_TAG_REMOVED',
    'BROADCAST_SENT',
    'BROADCAST_PAUSED',
    'BROADCAST_EMAIL_OPENED',
    'BROADCAST_EMAIL_LINK_CLICKED',
    'AUDIENCE_ADDED',
    'TAG_ADDED',
    'TAG_REMOVED',
  ]),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable('teamMemberships', {
  id,
  userId: primaryKeyCuid('userId').references(() => users.id),
  email: varchar('email', { length: 50 }).notNull(),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  role: mysqlEnum('role', ['ADMINISTRATOR', 'MANAGER', 'AUTHOR', 'GUEST']),
  status: mysqlEnum('status', ['PENDING', 'ACTIVE']),
  invitedAt: timestamp('invitedAt').defaultNow().notNull(),
  // invite expiration
  expiresAt: timestamp('expiresAt').notNull(),
})

export const audiences = mysqlTable('audiences', {
  id,
  name: varchar('name', { length: 50 }),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  knownProperties: json('knownProperties').$type<KnownAudienceProperty[]>(),
})

export const websites = mysqlTable('websites', {
  id,
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  slug: varchar('slug', { length: 72 }), // the subdomain of this specific newsletter website
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id)
    .notNull(),
  // Custom domain for website

  // Example: fastmedia.kibaletters.com -> fastmedia is the current website slug.
  // cname will be domain, example news.fastmedia.com, cname value will be fastmedia.kibaletters.com
  websiteDomain: varchar('websiteDomain', { length: 120 }).unique(),
  websiteDomainCnameValue: varchar('websiteDomainCnameValue', {
    length: 120,
  }),

  // when the cname was confirmed by background jobs
  websiteDomainVerifiedAt: timestamp('websiteDomainVerifiedAt'),
  // when the ssl certificate was issued and confirmed
  websiteDomainSslVerifiedAt: timestamp('websiteDomainSslVerifiedAt'),

  // the cert key and cert secretAccessKey
  // (encrypted) -> will be automatically added to the load balancer to automate ssl termination
  websiteSslCertKey: text('websiteSslCertKey'),
  websiteSslCertSecret: text('websiteSslCertSecret'),

  websiteSslCertChallengeToken: varchar('websiteSslCertChallengeToken', {
    length: 256,
  }),
  websiteSslCertChallengeKeyAuthorization: text(
    'websiteSslCertChallengeKeyAuthorization',
  ),
})

export const websitePages = mysqlTable(
  'websitePages',
  {
    id,
    title: varchar('title', { length: 72 }),
    path: varchar('path', { length: 72 }), // the path on the website

    description: text('description'),

    websiteId: primaryKeyCuid('websiteId').references(() => websites.id),
    websiteContent: json('websiteContent')
      .$type<UpdateWebsitePageDto['draftWebsiteContent']>()
      .notNull(),
    draftWebsiteContent: json('draftWebsiteContent')
      .$type<UpdateWebsitePageDto['draftWebsiteContent']>()
      .notNull(),

    publishedAt: timestamp('publishedAt'),
  },
  (table) => ({
    websiteIdPathKey: unique('websiteIdPathKey').on(table.websiteId, table.path),
  }),
)

export const contactImports = mysqlTable('contactImports', {
  id,
  name: varchar('name', { length: 50 }),
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id)
    .notNull(),
  status: mysqlEnum('status', ['PENDING', 'PROCESSING', 'FAILED', 'SUCCESS']),
  subscribeAllContacts: boolean('subscribeAllContacts').default(true),
  updateExistingContacts: boolean('updateExistingContacts').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  propertiesMap: json('propertiesMap')
    .$type<{
      email: string
      firstName?: string
      lastName?: string
      headers: string[]
      customPropertiesHeaders: string[]
      customProperties?:
        | Record<string, Omit<KnownAudienceProperty, 'options'>>
        | undefined
      tags: string[] // for each of these, save a new tag to the tags table for this audience.
      tagIds: string[]
    }>()
    .notNull(),
})

/**
 * Contacts table - Core entity for audience management and email targeting.
 *
 * This table is the foundation of Kibamail's audience management system, storing
 * all recipient information and engagement metrics. The contacts table:
 *
 * - Stores basic contact information (name, email)
 * - Tracks subscription status and verification
 * - Records detailed engagement metrics for segmentation
 * - Captures device and location data for targeting
 * - Maintains custom attributes for personalization
 *
 * The engagement metrics stored in this table power many of Kibamail's advanced features:
 * - Segmentation based on engagement (e.g., "contacts who opened in last 30 days")
 * - Automation triggers based on behavior
 * - Re-engagement campaigns for inactive contacts
 * - Deliverability optimization through engagement-based sending
 */
export const contacts = mysqlTable(
  'contacts',
  {
    id,
    // Basic contact information
    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),
    email: varchar('email', { length: 80 }).notNull(),
    avatarUrl: varchar('avatarUrl', { length: 256 }),

    // Subscription status tracking
    subscribedAt: timestamp('subscribedAt'),
    unsubscribedAt: timestamp('unsubscribedAt'),
    audienceId: primaryKeyCuid('audienceId')
      .references(() => audiences.id)
      .notNull(),

    // Email verification for double opt-in
    emailVerificationToken: varchar('emailVerificationToken', {
      length: 100,
    }),
    emailVerificationTokenExpiresAt: timestamp('emailVerificationTokenExpiresAt'),

    // Import tracking for compliance and audit
    contactImportId: primaryKeyCuid('contactImportId').references(
      () => contactImports.id,
    ),

    // Custom attributes for personalization and segmentation
    // Stored as JSON to support flexible schema per audience
    attributes: json('attributes').$type<Record<string, unknown>>(),
    createdAt: timestamp('createdAt').defaultNow(),

    // Engagement metrics for marketing campaigns
    // These timestamps enable powerful segmentation queries like:
    // "Contacts who opened an email in the last 30 days"
    // "Contacts who clicked but haven't purchased"
    lastSentBroadcastEmailAt: timestamp('lastSentBroadcastEmailAt'),
    lastSentAutomationEmailAt: timestamp('lastSentAutomationEmailAt'),

    lastOpenedBroadcastEmailAt: timestamp('lastOpenedBroadcastEmailAt'),
    lastClickedBroadcastEmailLinkAt: timestamp('lastClickedBroadcastEmailLinkAt'),

    lastOpenedAutomationEmailAt: timestamp('lastOpenedAutomationEmailAt'),
    lastClickedAutomationEmailLinkAt: timestamp('lastClickedAutomationEmailLinkAt'),

    // Device and location tracking for advanced segmentation
    // This data enables targeting based on device type or location
    lastTrackedActivityFrom: varchar('lastTrackedActivityFrom', {
      length: 10,
    }),
    lastTrackedActivityUsingDevice: varchar('lastTrackedActivityUsingDevice', {
      length: 56,
    }),
    lastTrackedActivityUsingBrowser: varchar('lastTrackedActivityUsingBrowser', {
      length: 56,
    }),
  },
  (table) => ({
    // Ensure email uniqueness within an audience
    // This constraint prevents duplicate contacts in the same audience
    ContactEmailAudienceIdKey: unique('ContactEmailAudienceIdKey').on(
      table.email,
      table.audienceId,
    ),
  }),
)

export const contactProperties = mysqlTable(
  'contactProperties',
  {
    id,
    name: varchar('name', { length: 256 }).notNull(),
    boolean: boolean('boolean'),
    date: timestamp('date'),
    text: varchar('text', { length: 256 }),
    float: float('float'),
    contactId: primaryKeyCuid('contactId')
      .references(() => contacts.id)
      .notNull(),
    audienceId: primaryKeyCuid('audienceId')
      .references(() => audiences.id)
      .notNull(),
  },
  (table) => ({
    propertyNameContactIdKey: unique('propertyNameContactIdKey').on(
      table.name,
      table.contactId,
    ),
  }),
)

export const tags = mysqlTable(
  'tags',
  {
    id,
    name: varchar('name', { length: 256 }).notNull(),
    description: varchar('description', { length: 256 }),
    audienceId: primaryKeyCuid('audienceId')
      .references(() => audiences.id)
      .notNull(),
  },
  (table) => ({
    tagNameAudienceIdKey: unique('tagNameAudienceIdKey').on(table.name, table.audienceId),
  }),
)

export const tagsOnContacts = mysqlTable(
  'tagsOnContacts',
  {
    id,
    tagId: primaryKeyCuid('tagId')
      .references(() => tags.id)
      .notNull(),
    contactId: primaryKeyCuid('contactId')
      .references(() => contacts.id)
      .notNull(),
    assignedAt: timestamp('assignedAt'),
  },
  (table) => ({
    tagsOnContactsTagIdContactIdKey: unique('tagsOnContactsTagIdContactIdKey').on(
      table.tagId,
      table.contactId,
    ),
    tagsOnContactsTagIdContactIdIdx: index('tagsOnContactsTagIdContactIdIdx').on(
      table.tagId,
      table.contactId,
    ),
  }),
)

export const automations = mysqlTable('automations', {
  id,
  name: varchar('name', { length: 50 }).notNull(),
  description: varchar('description', { length: 512 }),
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id, { onDelete: 'cascade' })
    .notNull(),
})

export const emails = mysqlTable('emails', {
  id,
  type: mysqlEnum('type', ['AUTOMATION', 'TRANSACTIONAL']).notNull(),
  title: varchar('title', { length: 50 }).notNull(),
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id, { onDelete: 'cascade' })
    .notNull(),
  emailContentId: primaryKeyCuid('emailContentId').references(() => emailContents.id, {
    onDelete: 'cascade',
  }),
  senderIdentityId: primaryKeyCuid('senderIdentityId').references(
    () => senderIdentities.id,
  ),
})

export const abTestVariants = mysqlTable('abTestVariants', {
  id,
  broadcastId: primaryKeyCuid('broadcastId')
    .references(() => broadcasts.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  emailContentId: primaryKeyCuid('emailContentId')
    .references(() => emailContents.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  weight: int('weight').default(1).notNull(), // in percentages.
  sendAt: timestamp('sendAt').$type<Date | undefined>(),
})

export const emailSends = mysqlTable('emailSends', {
  id,
  sendingId: varchar('sendingId', { length: 100 }).unique(), // from the mta
  sendingDomainId: primaryKeyCuid('sendingDomainId').references(() => sendingDomains.id),

  // product
  product: mysqlEnum('product', ['engage', 'send', 'letters']).notNull(),
  // if the email was sent from engage or letters, then the broadcastId will be set. This will be used for analytics queries like total bounced emails per broadcast.
  broadcastId: primaryKeyCuid('broadcastId').references(() => broadcasts.id, {
    onDelete: 'cascade',
  }),

  sender: varchar('sender', { length: 80 }),
  recipient: varchar('recipient', { length: 80 }),

  contactId: primaryKeyCuid('contactId').references(() => contacts.id),
  audienceId: primaryKeyCuid('audienceId').references(() => audiences.id),

  queue: varchar('queue', { length: 80 }),
  siteName: varchar('siteName', { length: 80 }),
  size: int('size'),
  totalAttempts: int('totalAttempts'),
  createdAt: timestamp('createdAt'),
  sendingSourceId: primaryKeyCuid('sendingSourceId').references(() => sendingSources.id),
  links: json('links').$type<string[]>(),
  nodeId: varchar('nodeId', { length: 48 }),
  egressPool: varchar('egressPool', { length: 80 }),
  egressSource: varchar('egressSource', { length: 80 }),
  deliveryProtocol: varchar('deliveryProtocol', { length: 12 }),
  receptionProtocl: varchar('receptionProtocol', { length: 12 }),

  clickTrackingEnabled: boolean('clickTrackingEnabled').default(false),
  openTrackingEnabled: boolean('openTrackingEnabled').default(false),
})

export const emailSendEvents = mysqlTable('emailSendEvents', {
  id,
  emailSendId: primaryKeyCuid('emailSendId')
    .notNull()
    .references(() => emailSends.id),
  type: mysqlEnum('type', [
    'Delivery',
    'Reception',
    'Bounce',
    'TransientFailure',
    'Expiration',
    'AdminBounce',
    'OOB',
    'Feedback',
    'Rejection',
    'AdminRebind',
    'Any',
    // custom from kibamail engage / send products
    'Click',
    'Open',
  ])
    .notNull()
    .$default(() => 'Any'),
  createdAt: timestamp('createdAt'),

  product: mysqlEnum('product', ['engage', 'send', 'letters']).notNull(),

  // for engage product, track the contact id.
  contactId: primaryKeyCuid('contactId').references(() => contacts.id),

  // for engage to track events per broadcast and per audience
  broadcastId: primaryKeyCuid('broadcastId').references(() => broadcasts.id, {
    onDelete: 'cascade',
  }),
  audienceId: primaryKeyCuid('audienceId').references(() => audiences.id, {
    onDelete: 'cascade',
  }),

  // response code (flat for easier querying)
  responseCode: int('responseCode'),
  responseContent: text('responseContent'),
  responseCommand: varchar('responseCommand', { length: 255 }),
  responseEnhancedCodeClass: int('responseEnhancedCodeClass'),
  responseEnhancedCodeSubject: int('responseEnhancedCodeSubject'),
  responseEnhancedCodeDetail: int('responseEnhancedCodeDetail'),

  // peer address
  peerAddressName: varchar('peerAddressName', { length: 255 }),
  peerAddressAddr: varchar('peerAddressAddr', { length: 255 }),

  // bounces
  bounceClassification: varchar('bounceClassification', { length: 120 }),

  // analytics (mostly for engage)
  originCountry: varchar('originCountry', { length: 10 }),
  originState: varchar('originState', { length: 56 }),
  originCity: varchar('originCity', { length: 56 }),
  originDevice: varchar('originDevice', { length: 56 }),
  originBrowser: varchar('originBrowser', { length: 56 }),
})

export const emailContents = mysqlTable('emailContents', {
  id,
  contentJson: json('contentJson'),
  contentText: text('contentText'),
  contentHtml: text('contentHtml'),
  subject: varchar('subject', { length: 255 }),
  previewText: varchar('previewText', { length: 255 }),
  updatedAt: timestamp('updatedAt'),
})

export const broadcasts = mysqlTable('broadcasts', {
  id,
  name: varchar('name', { length: 255 }).notNull(),

  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id)
    .notNull(),
  segmentId: primaryKeyCuid('segmentId').references(() => segments.id),
  broadcastGroupId: primaryKeyCuid('broadcastGroupId')
    .references(() => broadcastGroups.id)
    .notNull(),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  trackClicks: boolean('trackClicks'),
  trackOpens: boolean('trackOpens'),

  emailContentId: primaryKeyCuid('emailContentId').references(() => emailContents.id, {
    onDelete: 'cascade',
  }),
  senderIdentityId: primaryKeyCuid('senderIdentityId').references(
    () => senderIdentities.id,
  ),
  sendingDomainId: primaryKeyCuid('sendingDomainId').references(() => sendingDomains.id),
  winningAbTestVariantId: primaryKeyCuid('winningAbTestVariantId').references(
    (): AnyMySqlColumn => abTestVariants.id,
    {
      onDelete: 'cascade',
    },
  ),
  waitingTimeToPickWinner: int('waitingTimeToPickWinner').default(4), // in hours,
  status: mysqlEnum('status', [
    'SENT',
    'SENDING',
    'DRAFT',
    'QUEUED_FOR_SENDING',
    'SENDING_FAILED',
    'DRAFT_ARCHIVED',
    'ARCHIVED',
  ]).default('DRAFT'),
  isAbTest: boolean('isAbTest').default(false).notNull(),
  winningCriteria: mysqlEnum('winningCriteria', ['OPENS', 'CLICKS', 'CONVERSIONS']),
  winningWaitTime: int('winningWaitTime'),
  sendAt: timestamp('sendAt').$type<Date | undefined>(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt'),
})

export const broadcastGroups = mysqlTable(
  'broadcastGroups',
  {
    id,
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    teamId: primaryKeyCuid('teamId')
      .references(() => teams.id)
      .notNull(),
  },
  (table) => ({
    broadcastGroupNameOnTeamIdKey: unique('broadcastGroupNameOnTeamIdKey').on(
      table.teamId,
      table.name,
    ),
  }),
)

export type ACTION_ADD_TAG_CONFIGURATION = {
  tagIds: string[]
}
export type ACTION_REMOVE_TAG_CONFIGURATION = {
  tagIds: string[]
}
export type ACTION_UPDATE_CONTACT_ATTRIBUTES = {
  attributes: Record<string, unknown>
}
export type ACTION_SEND_EMAIL_CONFIGURATION = {
  emailId: string
}

export type RULE_WAIT_FOR_DURATION_CONFIGURATION = {
  delay: number
}

export type RULE_IF_ELSE_CONFIGURATION = {
  filterGroups: ContactFilterGroups
}

export type TRIGGER_CONFIGURATION = {
  filterGroups: ContactFilterGroups
  tagIds: string[]
}

export type END_CONFIGURATION = { id?: string }

export type ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION = {
  audienceId: string
}

export type AutomationStepConfiguration =
  | TRIGGER_CONFIGURATION
  | END_CONFIGURATION
  | ACTION_ADD_TAG_CONFIGURATION
  | ACTION_REMOVE_TAG_CONFIGURATION
  | ACTION_SEND_EMAIL_CONFIGURATION
  | ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION
  | ACTION_UPDATE_CONTACT_ATTRIBUTES
  | RULE_IF_ELSE_CONFIGURATION
  | RULE_WAIT_FOR_DURATION_CONFIGURATION

export const automationSteps = mysqlTable('automationSteps', {
  id,
  automationId: primaryKeyCuid('automationId')
    .references(() => automations.id)
    .notNull(),
  type: mysqlEnum('type', automationStepTypes).notNull(),
  status: mysqlEnum('status', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'])
    .notNull()
    .default('DRAFT'),
  subtype: mysqlEnum('subtype', automationStepSubtypes).notNull(),
  parentId: primaryKeyCuid('parentId').references(
    (): AnyMySqlColumn => automationSteps.id,
    {
      onDelete: 'cascade',
    },
  ),
  branchIndex: int('branchIndex'),
  configuration: json('configuration').$type<AutomationStepConfiguration>().notNull(),
  emailId: primaryKeyCuid('emailId').references(() => emails.id),
  tagId: primaryKeyCuid('tagId').references(() => tags.id),
  audienceId: primaryKeyCuid('audienceId').references(() => audiences.id),
})

export const segments = mysqlTable('segments', {
  id,
  name: varchar('name', { length: 255 }).notNull(),
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id)
    .notNull(),
  filterGroups: json('filterGroups').$type<ContactFilterGroups>().notNull(),
})

export const contactAutomationSteps = mysqlTable('contactAutomationSteps', {
  id,
  automationStepId: primaryKeyCuid('automationStepId')
    .references(() => automationSteps.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  contactId: primaryKeyCuid('contactId')
    .references(() => contacts.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  status: mysqlEnum('status', [
    'PENDING',
    'ACTIVE',
    'COMPLETED',
    'FAILED',
    'HALTED',
  ]).default('PENDING'),
  haltedAt: timestamp('haltedAt'),
  failedAt: timestamp('failedAt'),
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt'),
  output: json('output').$type<string[]>(),
})

export const contactPurchases = mysqlTable('contactPurchases', {
  id,
  // find all contacts on a specific product (or subscription plan in case of a recurring product)
  productId: primaryKeyCuid('productId')
    .references(() => products.id)
    .notNull(),
  contactId: primaryKeyCuid('contactId')
    .references(() => contacts.id)
    .notNull(),
  purchasedAt: timestamp('purchasedAt'),
  expiresAt: timestamp('expiresAt'), // for subscription type products
  cancelledAt: timestamp('cancelledAt'), // when contact has cancelled subscription
  providerSubscriptionId: varchar('providerSubscriptionId', {
    length: 100,
  }),
})

// Kiba commerce
export const products = mysqlTable('products', {
  id,
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  audienceId: primaryKeyCuid('audienceId').references(() => audiences.id),
  billingCycle: mysqlEnum('cycle', ['monthly', 'yearly', 'once']).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  price: int('price'), // for one time payments
  priceYearly: int('priceYearly'), // for subscription payments
  priceMonthly: int('priceMonthly'), // for subscription payments in cents (or kobo, depends on billing provider.)
})

export const productContents = mysqlTable('productContents', {
  id,
  productId: primaryKeyCuid('productId').references(() => products.id),
  type: mysqlEnum('type', ['downloadable', 'course']).notNull(),
})

// Kiba leads
export const forms = mysqlTable('forms', {
  id,
  type: mysqlEnum('type', ['survey', 'signup']),
  appearance: mysqlEnum('appearance', [
    'popover',
    'inline',
    'floating',
    'fullscreen',
  ]).notNull(),
  audienceId: primaryKeyCuid('audienceId')
    .references(() => audiences.id)
    .notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  fields:
    json('fields').$type<(CreateFormDto['fields'][number] & { deleted?: boolean })[]>(),
  archivedAt: timestamp('archivedAt'),
  // on form submitted:
  // -> redirect to a page
  // -> present with a survey (another form)
  // -> show a thank you message
})

export const formResponses = mysqlTable('formResponses', {
  id,
  formId: primaryKeyCuid('formId')
    .references(() => forms.id)
    .notNull(),
  contactId: primaryKeyCuid('contactId').references(() => contacts.id),
  response: json('response').$type<SubmitFormDto['responses']>(),
})

/* CHAT */

export const channels = mysqlTable('channels', {
  id,
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('createdAt'),
  private: boolean('private').notNull(),
})

// A private chat is basically a channel with only 2 members
// and we can modify the display of the ui based on this.

export const channelMemberships = mysqlTable('channelMemberships', {
  id,
  channelId: primaryKeyCuid('channelId')
    .references(() => channels.id)
    .notNull(),
  userId: primaryKeyCuid('userId')
    .references(() => users.id)
    .notNull(),
})

export const messages = mysqlTable(
  'messages',
  {
    id,
    // We'll use AI to auto parse a message body and generate a title and slug.
    // we will then index the entire thread, so it appears to google like this is a stackoverflow
    // // like discussion forum.
    title: varchar('title', { length: 120 }),
    slug: varchar('slug', { length: 120 }).unique(),
    channelId: primaryKeyCuid('channelId')
      .references(() => channels.id)
      .notNull(),
    userId: primaryKeyCuid('userId')
      .references(() => users.id)
      .notNull(),
    content: json('content').$type<Record<string, string[]>>().notNull(),
    parentMessageId: primaryKeyCuid('parentMessageId').references(
      (): AnyMySqlColumn => messages.id,
    ),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt'),
  },
  (table) => ({
    messageChannelIdIndex: index('messageChannelIdIndex').on(table.channelId),
    messageCreatedAtIndex: index('messageCreatedAtIndex').on(table.createdAt),
  }),
)

export const messageReactions = mysqlTable('messageReactions', {
  id,
  messageId: primaryKeyCuid('messageId')
    .references(() => messages.id)
    .notNull(),
  userId: primaryKeyCuid('userId')
    .references(() => users.id)
    .notNull(),
  emoji: varchar('emoji', { length: 50 }).notNull(),
})

export const fonts = mysqlTable('fonts', {
  id,
  family: varchar('family', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  files: json('files').$type<Record<string, string>>().notNull(),
  teamId: primaryKeyCuid('teamId').references(() => teams.id),
  subsets: varchar('subsets', { length: 255 }),
  variants: varchar('variants', { length: 255 }),
})

export const mediaDocuments = mysqlTable('mediaDocuments', {
  id,
  name: varchar('name', { length: 255 }),
  altText: varchar('altText', { length: 255 }),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  url: text('url').notNull(),
})

export const creditGrantMandates = mysqlTable('creditGrantMandates', {
  id,
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  // 10,000 free credits per month by default to all teams
  amount: int('amount').notNull(),
  status: mysqlEnum('status', ['paused', 'active']).default('active').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt'),
})

export const creditPurchases = mysqlTable('creditPurchases', {
  id,
  amount: int('amount').notNull(),
  // this will be zero for credit grants (Example: 10,000 free credits per month for each team)
  amountPaid: int('amountPaid').notNull(),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  currency: varchar('currency', { length: 10 }).notNull(), // USD, EUR, NGN
  paymentProvider: varchar('paymentProvider', { length: 20 }).notNull(), // stripe, paystack, flutterwave
  status: mysqlEnum('status', ['pending', 'successful', 'failed']).notNull(),
  paymentReferenceId: varchar('paymentReferenceId', { length: 255 }),
  createdAt: timestamp('createdAt').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  updatedAt: timestamp('updatedAt'),
  metadata: json('metadata').$type<Record<string, string>>(),
})

export const creditRefunds = mysqlTable('creditRefunds', {
  id,
  amount: int('amount').notNull(),
  amountRefunded: int('amountRefunded').notNull(),
  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),
  refundStatus: mysqlEnum('refundStatus', ['pending', 'successful', 'failed']).notNull(),
  paymentRefundReferenceId: varchar('paymentRefundReferenceId', {
    length: 255,
  }),
  metadata: json('metadata').$type<Record<string, string>>(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt'),
})

/**
 * SenderIdentities table - Manages reusable sender information for emails.
 *
 * This table stores predefined sender profiles that users can select when sending
 * broadcasts, eliminating the need to manually enter sender details for each email.
 * Each sender identity:
 *
 * - Name - used as the fromName when injecting emails into the mta
 * - Contains the local part of the email address (before the @ symbol) - Will be combined with the sendingDomain to create the full domain for the fromEmail field
 * - Is associated with a specific sending domain for the domain part
 * - Belongs to a team for proper multi-tenant isolation
 * - Includes verification mechanisms for sender email addresses
 * - Can specify a custom reply-to address for responses
 *
 * Sender identities improve the user experience by providing consistent sender
 * information across campaigns and reducing the potential for errors when
 * configuring email sending details.
 */
export const senderIdentities = mysqlTable('senderIdentities', {
  id,
  name: varchar('name', { length: 100 }).notNull(),

  email: varchar('email', { length: 80 }).notNull(),

  sendingDomainId: primaryKeyCuid('sendingDomainId')
    .references(() => sendingDomains.id)
    .notNull(),

  teamId: primaryKeyCuid('teamId')
    .references(() => teams.id)
    .notNull(),

  emailVerificationCode: varchar('emailVerificationCode', { length: 256 }),
  emailVerifiedAt: timestamp('emailVerifiedAt'),
  emailVerificationCodeExpiresAt: timestamp('emailVerificationCodeExpiresAt'),

  replyToEmail: varchar('replyToEmail', { length: 255 }),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt'),
})

/* --------------------------- */
/*      Table relations        */
/* --------------------------- */
export const broadcastRelations = relations(broadcasts, ({ one }) => ({
  emailContent: one(emailContents, {
    fields: [broadcasts.emailContentId],
    references: [emailContents.id],
  }),
  senderIdentity: one(senderIdentities, {
    fields: [broadcasts.senderIdentityId],
    references: [senderIdentities.id],
  }),
}))

export const senderIdentityRelations = relations(senderIdentities, ({ one }) => ({
  team: one(teams, {
    fields: [senderIdentities.teamId],
    references: [teams.id],
  }),
  sendingDomain: one(sendingDomains, {
    fields: [senderIdentities.sendingDomainId],
    references: [sendingDomains.id],
  }),
}))
