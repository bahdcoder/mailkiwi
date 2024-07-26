import { relations } from 'drizzle-orm'
import {
  type AnyMySqlColumn,
  boolean,
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

import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'

const id = varchar('id', { length: 40 }).primaryKey().notNull().$defaultFn(cuid)

// Tables
export const settings = mysqlTable('settings', {
  id,
  url: varchar('url', { length: 256 }).unique(),
  domain: varchar('domain', { length: 50 }).unique().notNull(),
  installedSslCertificate: boolean('installedSslCertificate')
    .default(false)
    .notNull(),
})

export const users = mysqlTable('users', {
  id,
  email: varchar('email', { length: 80 }).unique().notNull(),
  name: varchar('name', { length: 80 }),
  avatarUrl: varchar('avatarUrl', { length: 256 }),
  password: varchar('password', { length: 256 }).notNull(),
})

export const accessTokens = mysqlTable('accessTokens', {
  id,
  userId: varchar('userId', { length: 32 }).references(() => users.id),
  teamId: varchar('teamId', { length: 32 }).references(() => teams.id),
  type: varchar('type', { length: 16 }).notNull(),
  name: varchar('name', { length: 32 }),
  hash: varchar('hash', { length: 100 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  lastUsedAt: timestamp('lastUsedAt').defaultNow().notNull(),
  expiresAt: timestamp('expiresAt').defaultNow().notNull(),
})

export const teams = mysqlTable('teams', {
  id,
  name: varchar('name', { length: 100 }).notNull(),
  userId: varchar('userId', { length: 32 })
    .notNull()
    .references(() => users.id),
  trackClicks: boolean('trackClicks'),
  trackOpens: boolean('trackOpens'),
  configurationKey: varchar('configurationKey', { length: 512 }).notNull(),
  broadcastEditor: mysqlEnum('broadcastEditor', ['DEFAULT', 'MARKDOWN']),
})

export const mailers = mysqlTable('mailers', {
  id,
  name: varchar('name', { length: 50 }).notNull(),
  configuration: varchar('configuration', { length: 512 }).notNull(),
  default: boolean('default'),
  provider: mysqlEnum('provider', ['AWS_SES', 'POSTMARK', 'MAILGUN']).notNull(),
  status: mysqlEnum('status', [
    'READY',
    'PENDING',
    'INSTALLING',
    'CREATING_IDENTITIES',
    'SENDING_TEST_EMAIL',
    'DISABLED',
    'ACCOUNT_SENDING_NOT_ENABLED',
    'ACCESS_KEYS_LOST_PROVIDER_ACCESS',
  ])
    .default('PENDING')
    .notNull(),
  teamId: varchar('teamId', { length: 512 })
    .references(() => teams.id)
    .unique()
    .notNull(),
  sendingEnabled: boolean('sendingEnabled').default(false).notNull(),
  inSandboxMode: boolean('inSandboxMode').default(true).notNull(),
  max24HourSend: int('max24HourSend'),
  maxSendRate: int('maxSendRate'),
  sentLast24Hours: int('sentLast24Hours'),
  testEmailSentAt: timestamp('testEmailSentAt'),
  installationCompletedAt: timestamp('installationCompletedAt'),
})

export const mailerIdentities = mysqlTable('mailerIdentities', {
  id,
  mailerId: varchar('mailerId', { length: 32 }).references(() => mailers.id),
  value: varchar('value', { length: 50 }).notNull(),
  type: mysqlEnum('type', ['EMAIL', 'DOMAIN']).notNull(),
  status: mysqlEnum('status', [
    'PENDING',
    'APPROVED',
    'DENIED',
    'FAILED',
    'TEMPORARILY_FAILED',
  ])
    .default('PENDING')
    .notNull(),
  configuration: json('configuration'),
  confirmedApprovalAt: timestamp('confirmedApprovalAt'),
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
  teamId: varchar('teamId', { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable('teamMemberships', {
  id,
  userId: varchar('userId', { length: 32 }).references(() => users.id),
  email: varchar('email', { length: 50 }).notNull(),
  teamId: varchar('teamId', { length: 32 })
    .references(() => teams.id)
    .notNull(),
  role: mysqlEnum('role', ['ADMINISTRATOR', 'USER']),
  status: mysqlEnum('status', ['PENDING', 'ACTIVE']),
  invitedAt: timestamp('invitedAt').defaultNow().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
})

export const audiences = mysqlTable('audiences', {
  id,
  name: varchar('name', { length: 50 }).notNull(),
  teamId: varchar('teamId', { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const contacts = mysqlTable(
  'contacts',
  {
    id,
    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),
    email: varchar('email', { length: 80 }).notNull(),
    avatarUrl: varchar('avatarUrl', { length: 256 }),
    subscribedAt: timestamp('subscribedAt'),
    unsubscribedAt: timestamp('unsubscribedAt'),
    audienceId: varchar('audienceId', { length: 32 })
      .references(() => audiences.id)
      .notNull(),
    attributes: json('attributes').$type<Record<string, any>>(),
  },
  (table) => ({
    ContactEmailAudienceIdKey: unique('ContactEmailAudienceIdKey').on(
      table.email,
      table.audienceId,
    ),
  }),
)

export const tags = mysqlTable('tags', {
  id,
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 256 }),
  audienceId: varchar('audienceId', { length: 32 })
    .references(() => audiences.id)
    .notNull(),
})

export const tagsOnContacts = mysqlTable(
  'tagsOnContacts',
  {
    tagId: varchar('tagId', { length: 32 })
      .references(() => tags.id)
      .notNull(),
    contactId: varchar('contactId', { length: 32 })
      .references(() => contacts.id)
      .notNull(),
    assignedAt: timestamp('assignedAt'),
  },
  (table) => ({
    tagsOnContactsTagIdContactIdKey: unique(
      'tagsOnContactsTagIdContactIdKey',
    ).on(table.tagId, table.contactId),
    tagsOnContactsTagIdContactIdIdx: index(
      'tagsOnContactsTagIdContactIdIdx',
    ).on(table.tagId, table.contactId),
  }),
)

export const automations = mysqlTable('automations', {
  id,
  name: varchar('name', { length: 50 }).notNull(),
  description: varchar('description', { length: 512 }),
  audienceId: varchar('audienceId', { length: 32 })
    .references(() => audiences.id, { onDelete: 'cascade' })
    .notNull(),
})

export const emails = mysqlTable('emails', {
  id,
  type: mysqlEnum('type', ['AUTOMATION', 'TRANSACTIONAL']).notNull(),
  title: varchar('title', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 180 }),
  audienceId: varchar('audienceId', { length: 32 })
    .references(() => audiences.id, { onDelete: 'cascade' })
    .notNull(),
  content: json('content'),
  contentText: text('contentText'),
})

export const sends = mysqlTable('sends', {
  id,
  type: mysqlEnum('type', [
    'AUTOMATION',
    'TRANSACTIONAL',
    'BROADCAST',
  ]).notNull(),
  status: mysqlEnum('status', ['PENDING', 'SENT', 'FAILED']).notNull(),
  email: varchar('email', { length: 80 }),
  contentText: json('content'),
  contentJson: text('contentJson'),
  contentHtml: text('contentHtml'),
  contactId: varchar('contactId', { length: 32 })
    .references(() => contacts.id, { onDelete: 'cascade' })
    .notNull(),
  broadcastId: varchar('broadcastId', { length: 32 }).references(
    () => broadcasts.id,
    { onDelete: 'cascade' },
  ),
  sentAt: timestamp('sentAt'),
  timeoutAt: timestamp('timeoutAt'),
  messageId: varchar('messageId', { length: 255 }),
  logs: json('logs'),
  automationStepId: varchar('automationStepId', { length: 32 }).references(
    () => automationSteps.id,
    { onDelete: 'cascade' },
  ),
})

export const broadcasts = mysqlTable('broadcasts', {
  id,
  name: varchar('name', { length: 255 }).notNull(),
  fromName: varchar('fromName', { length: 255 }),
  fromEmail: varchar('fromEmail', { length: 255 }),
  replyToEmail: varchar('replyToEmail', { length: 255 }),
  replyToName: varchar('replyToName', { length: 255 }),
  audienceId: varchar('audienceId', { length: 32 })
    .references(() => audiences.id)
    .notNull(),
  teamId: varchar('teamId', { length: 32 })
    .references(() => teams.id)
    .notNull(),
  trackClicks: boolean('trackClicks'),
  trackOpens: boolean('trackOpens'),
  contentJson: json('contentJson'),
  contentText: text('contentText'),
  contentHtml: text('contentHtml'),
  subject: varchar('subject', { length: 255 }),
  previewText: varchar('previewText', { length: 255 }),
  status: mysqlEnum('status', [
    'SENT',
    'SENDING',
    'DRAFT',
    'QUEUED_FOR_SENDING',
    'SENDING_FAILED',
    'DRAFT_ARCHIVED',
    'ARCHIVED',
  ]).default('DRAFT'),
  sendAt: timestamp('sendAt').$type<Date | undefined>(),
})

export const automationStepSubtypesTrigger = [
  'TRIGGER_CONTACT_SUBSCRIBED',
  'TRIGGER_CONTACT_UNSUBSCRIBED',
  'TRIGGER_CONTACT_TAG_ADDED',
  'TRIGGER_CONTACT_TAG_REMOVED',
  'TRIGGER_API_MANUAL',
] as const

export const automationStepSubtypesAction = [
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

export const automationSteps = mysqlTable('automationSteps', {
  id,
  automationId: varchar('automationId', { length: 32 })
    .references(() => automations.id)
    .notNull(),
  type: mysqlEnum('type', automationStepTypes).notNull(),
  status: mysqlEnum('status', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'])
    .notNull()
    .default('DRAFT'),
  subtype: mysqlEnum('subtype', automationStepSubtypes).notNull(),
  parentId: varchar('parentId', { length: 32 }).references(
    (): AnyMySqlColumn => automationSteps.id,
    { onDelete: 'cascade' },
  ),
  branchIndex: int('branchIndex'),
  configuration: json('configuration').notNull(),
  emailId: varchar('emailId', { length: 32 }).references(() => emails.id),
  tagId: varchar('tagId', { length: 32 }).references(() => tags.id),
  audienceId: varchar('audienceId', { length: 32 }).references(
    () => audiences.id,
  ),
})

export const contactAutomationStep = mysqlTable('contactAutomationSteps', {
  id,
  automationStepId: varchar('automationStepId', { length: 32 })
    .references(() => automationSteps.id, { onDelete: 'cascade' })
    .notNull(),
  contactId: varchar('contactId', { length: 32 })
    .references(() => contacts.id, { onDelete: 'cascade' })
    .notNull(),
  haltedAt: timestamp('haltedAt'),
  failedAt: timestamp('failedAt'),
  startedAt: timestamp('startedAt'),
  completedAt: timestamp('completedAt'),
  output: json('output'),
})

// Relations remain the same as in the original file

// Relations
export const userRelations = relations(users, ({ many }) => ({
  teams: many(teams),
  accessTokens: many(accessTokens),
  memberships: many(teamMemberships),
}))

export const teamRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.userId], references: [users.id] }),
  members: many(teamMemberships),
  webhooks: many(webhooks),
  accessTokens: many(accessTokens),
  audiences: many(audiences),
  mailer: one(mailers, { fields: [teams.id], references: [mailers.teamId] }),
}))

export const accessTokenRelations = relations(accessTokens, ({ one }) => ({
  user: one(users, { fields: [accessTokens.userId], references: [users.id] }),
  team: one(teams, { fields: [accessTokens.teamId], references: [teams.id] }),
}))

export const broadcastRelations = relations(broadcasts, ({ one, many }) => ({
  audience: one(audiences, {
    fields: [broadcasts.audienceId],
    references: [audiences.id],
  }),
  team: one(teams, { fields: [broadcasts.teamId], references: [teams.id] }),
  sends: many(sends, { relationName: 'broadcastSends' }),
}))

export const sendsRelations = relations(sends, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [sends.contactId],
    references: [contacts.id],
  }),
  broadcast: one(broadcasts, {
    fields: [sends.broadcastId],
    references: [broadcasts.id],
    relationName: 'broadcastSends',
  }),
  automationStep: one(automationSteps, {
    fields: [sends.automationStepId],
    references: [automationSteps.id],
  }),
}))

export const mailerRelations = relations(mailers, ({ one, many }) => ({
  team: one(teams, { fields: [mailers.teamId], references: [teams.id] }),
  identities: many(mailerIdentities),
}))

export const MailerIdentityRelations = relations(
  mailerIdentities,
  ({ one }) => ({
    mailer: one(mailers, {
      fields: [mailerIdentities.mailerId],
      references: [mailers.id],
    }),
  }),
)

export const WebhookRelations = relations(webhooks, ({ one }) => ({
  team: one(teams, { fields: [webhooks.teamId], references: [teams.id] }),
}))

export const TeamMembershipRelations = relations(
  teamMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [teamMemberships.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [teamMemberships.teamId],
      references: [teams.id],
    }),
  }),
)

export const AudienceRelations = relations(audiences, ({ one, many }) => ({
  team: one(teams, { fields: [audiences.teamId], references: [teams.id] }),
  contacts: many(contacts),
}))

export const ContactRelations = relations(contacts, ({ one, many }) => ({
  audience: one(audiences, {
    fields: [contacts.audienceId],
    references: [audiences.id],
  }),
  tags: many(tagsOnContacts),
}))

export const TagRelations = relations(tags, ({ many }) => ({
  contacts: many(tagsOnContacts),
}))

export const TagsOnContactsRelations = relations(tagsOnContacts, ({ one }) => ({
  tag: one(tags, { fields: [tagsOnContacts.tagId], references: [tags.id] }),
  contact: one(contacts, {
    fields: [tagsOnContacts.contactId],
    references: [contacts.id],
  }),
}))

export const automationRelations = relations(automations, ({ one, many }) => ({
  audience: one(audiences, {
    fields: [automations.audienceId],
    references: [audiences.id],
  }),
  steps: many(automationSteps),
}))

export const automationStepsRelations = relations(
  automationSteps,
  ({ one, many }) => ({
    automation: one(automations, {
      fields: [automationSteps.automationId],
      references: [automations.id],
    }),
    parent: one(automationSteps, {
      fields: [automationSteps.parentId],
      references: [automationSteps.id],
      relationName: 'steps',
    }),
    steps: many(automationSteps, {
      relationName: 'steps',
    }),
  }),
)
