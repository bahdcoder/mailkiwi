import { relations } from "drizzle-orm"
import {
  AnySQLiteColumn,
  index,
  int,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { cuid } from "@/domains/shared/utils/cuid/cuid.ts"

const id = text("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid)

// Tables
export const settings = sqliteTable("settings", {
  id,
  url: text("url", { length: 256 }).unique(),
  domain: text("domain", { length: 50 }).unique().notNull(),
  installedSslCertificate: integer("installedSslCertificate", {
    mode: "boolean",
  })
    .default(false)
    .notNull(),
})

export const users = sqliteTable("users", {
  id,
  email: text("email", { length: 80 }).unique().notNull(),
  name: text("name", { length: 80 }),
  avatarUrl: text("avatarUrl", { length: 256 }),
  password: text("password", { length: 256 }).notNull(),
})

export const accessTokens = sqliteTable("accessTokens", {
  id,
  userId: text("userId", { length: 32 }).references(() => users.id),
  teamId: text("teamId", { length: 32 }).references(() => teams.id),
  type: text("type", { length: 16 }).notNull(),
  name: text("name", { length: 32 }),
  hash: text("hash", { length: 100 }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).defaultNow().notNull(),
})

export const teams = sqliteTable("teams", {
  id,
  name: text("name", { length: 100 }).notNull(),
  userId: text("userId", { length: 32 })
    .notNull()
    .references(() => users.id),
  trackClicks: integer("trackClicks", { mode: "boolean" }),
  trackOpens: integer("trackOpens", { mode: "boolean" }),
  configurationKey: text("configurationKey", { length: 512 }).notNull(),
  broadcastEditor: text("broadcastEditor", { enum: ["DEFAULT", "MARKDOWN"] }),
})

export const mailers = sqliteTable("mailers", {
  id,
  name: text("name", { length: 50 }).notNull(),
  configuration: text("configuration", { length: 512 }).notNull(),
  default: integer("default", { mode: "boolean" }),
  provider: text("provider", {
    enum: ["AWS_SES", "POSTMARK", "MAILGUN"],
  }).notNull(),
  status: text("status", {
    enum: [
      "READY",
      "PENDING",
      "INSTALLING",
      "CREATING_IDENTITIES",
      "SENDING_TEST_EMAIL",
      "DISABLED",
      "ACCESS_KEYS_LOST_PROVIDER_ACCESS",
    ],
  })
    .default("PENDING")
    .notNull(),
  teamId: text("teamId", { length: 512 })
    .references(() => teams.id)
    .unique()
    .notNull(),
  sendingEnabled: integer("sendingEnabled", { mode: "boolean" })
    .default(false)
    .notNull(),
  inSandboxMode: integer("inSandboxMode", { mode: "boolean" })
    .default(true)
    .notNull(),
  max24HourSend: int("max24HourSend"),
  maxSendRate: int("maxSendRate"),
  sentLast24Hours: int("sentLast24Hours"),
  testEmailSentAt: integer("testEmailSentAt"),
  installationCompletedAt: integer("installationCompletedAt"),
})

export const mailerIdentities = sqliteTable("mailerIdentities", {
  id,
  mailerId: text("mailerId", { length: 32 }).references(() => mailers.id),
  value: text("value", { length: 50 }).notNull(),
  type: text("type", { enum: ["EMAIL", "DOMAIN"] }).notNull(),
  status: text("status", {
    enum: ["PENDING", "APPROVED", "DENIED", "FAILED", "TEMPORARILY_FAILED"],
  })
    .default("PENDING")
    .notNull(),
  configuration: text("configuration", { mode: "json" }),
  confirmedApprovalAt: integer("confirmedApprovalAt"),
})

export const webhooks = sqliteTable("webhooks", {
  id,
  name: text("name", { length: 50 }).notNull(),
  url: text("url", { length: 256 }).notNull(),
  events: text("webhookEvent", {
    enum: [
      "ALL_EVENTS",
      "CONTACT_ADDED",
      "CONTACT_REMOVED",
      "CONTACT_TAG_ADDED",
      "CONTACT_TAG_REMOVED",
      "BROADCAST_SENT",
      "BROADCAST_PAUSED",
      "BROADCAST_EMAIL_OPENED",
      "BROADCAST_EMAIL_LINK_CLICKED",
      "AUDIENCE_ADDED",
      "TAG_ADDED",
      "TAG_REMOVED",
    ],
  }),
  teamId: text("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = sqliteTable("teamMemberships", {
  id,
  userId: text("userId", { length: 32 }).references(() => users.id),
  email: text("email", { length: 50 }).notNull(),
  teamId: text("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
  role: text("role", { enum: ["ADMINISTRATOR", "USER"] }),
  status: text("role", { enum: ["PENDING", "ACTIVE"] }),
  invitedAt: integer("invitedAt", { mode: "timestamp" }).defaultNow().notNull(),
  expiresAt: integer("expiresAt").notNull(),
})

export const audiences = sqliteTable("audiences", {
  id,
  name: text("name", { length: 50 }).notNull(),
  teamId: text("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const contacts = sqliteTable(
  "contacts",
  {
    id,
    firstName: text("firstName", { length: 50 }),
    lastName: text("lastName", { length: 50 }),
    email: text("email", { length: 80 }).notNull(),
    avatarUrl: text("avatarUrl", { length: 256 }),
    subscribedAt: integer("subscribedAt"),
    unsubscribedAt: integer("unsubscribedAt"),
    audienceId: text("audienceId", { length: 32 })
      .references(() => audiences.id)
      .notNull(),
    attributes: text("attributes", { mode: "json" }).$type<
      Record<string, string | string[] | number[] | number>
    >(),
  },
  (table) => ({
    Contact_email_audienceId_key: uniqueIndex(
      "Contact_email_audienceId_key",
    ).on(table.email, table.audienceId),
  }),
)

export const tags = sqliteTable("tags", {
  id,
  name: text("name", { length: 256 }).notNull(),
  description: text("description", { length: 256 }),
  audienceId: text("audienceId", { length: 32 })
    .references(() => audiences.id)
    .notNull(),
})

export const queueJobs = sqliteTable("queueJobs", {
  id,
  jobId: text("jobId").notNull(),
  attemptsCount: integer("attemptsCount").notNull().default(0),
  maxAttempts: integer("maxAttempts").notNull().default(3),
  dispatchedAt: integer("dispatchedAt", { mode: "timestamp" }).notNull(),
  lockedAt: integer("lockedAt", { mode: "timestamp" }),
  processAt: integer("processAt", { mode: "timestamp" }),
  timeoutAt: integer("timeoutAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  payload: text("payload", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  queue: text("queue"),
  attemptLogs: text("attemptLogs", { mode: "json" }).$type<string[]>(),
})

export const tagsOnContacts = sqliteTable(
  "tagsOnContacts",
  {
    tagId: text("tagId", { length: 32 })
      .references(() => tags.id)
      .notNull(),
    contactId: text("contactId", { length: 32 })
      .references(() => contacts.id)
      .notNull(),
    assignedAt: integer("assignedAt"),
  },
  (table) => ({
    tagsOnContactsTagIdContactIdKey: uniqueIndex(
      "tagsOnContactsTagIdContactIdKey",
    ).on(table.tagId, table.contactId),
    tagsOnContactsTagIdContactIdIdx: index(
      "tagsOnContactsTagIdContactIdIdx",
    ).on(table.tagId, table.contactId),
  }),
)

export const automations = sqliteTable("automations", {
  id,
  name: text("name", { length: 50 }).notNull(),
  description: text("description", { length: 512 }),
  audienceId: text("audienceId", { length: 32 })
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
})

export const emails = sqliteTable("emails", {
  id,
  type: text("type", { enum: ["AUTOMATION", "TRANSACTIONAL"] }).notNull(),
  title: text("title", { length: 50 }).notNull(),
  subject: text("subject", { length: 180 }),
  audienceId: text("audienceId", { length: 32 })
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content", { mode: "json" }).$type<Record<string, any>>(),
  contentText: text("contentText", { mode: "text" }),
})

export const automationStepSubtypesTrigger = [
  "TRIGGER_CONTACT_SUBSCRIBED",
  "TRIGGER_CONTACT_UNSUBSCRIBED",
  "TRIGGER_CONTACT_TAG_ADDED",
  "TRIGGER_CONTACT_TAG_REMOVED",
  "TRIGGER_API_MANUAL",
] as const

export const automationStepSubtypesAction = [
  "ACTION_SEND_EMAIL",
  "ACTION_ADD_TAG",
  "ACTION_REMOVE_TAG",
  "ACTION_SUBSCRIBE_TO_AUDIENCE",
  "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
  "ACTION_UPDATE_CONTACT_ATTRIBUTES",
] as const

export const automationStepSubtypesRule = [
  "RULE_IF_ELSE",
  "RULE_WAIT_FOR_DURATION",
  "RULE_PERCENTAGE_SPLIT",
  "RULE_WAIT_FOR_TRIGGER",
] as const

export const automationStepSubtypesEnd = ["END"] as const

export const automationStepSubtypes = [
  // TRIGGERS
  ...automationStepSubtypesTrigger,

  // ACTIONS
  ...automationStepSubtypesAction,

  // RULES
  ...automationStepSubtypesRule,

  // END
  ...automationStepSubtypesEnd,
] as const

export const automationStepTypes = ["TRIGGER", "ACTION", "RULE", "END"] as const

// src/infrastructure/database/schema/schema.ts

export const broadcasts = sqliteTable("broadcasts", {
  id,
  name: text("name").notNull(),
  fromName: text("fromName"),
  fromEmail: text("fromEmail"),
  replyToEmail: text("replyToEmail"),
  replyToName: text("replyToName"),
  audienceId: text("audienceId")
    .references(() => audiences.id)
    .notNull(),
  teamId: text("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
  trackClicks: integer("trackClicks", { mode: "boolean" }),
  trackOpens: integer("trackOpens", { mode: "boolean" }),
  contentJson: text("contentJson", { mode: "json" }),
  contentText: text("contentText"),
  contentHtml: text("contentHtml"),
  subject: text("subject"),
  previewText: text("previewText"),
  status: text("status"),
  sendAt: integer("sendAt", { mode: "timestamp" }),
})

export const automationSteps = sqliteTable("automationSteps", {
  id,
  automationId: text("automationId", { length: 32 })
    .references(() => automations.id)
    .notNull(),
  type: text("type", { enum: automationStepTypes }).notNull(),
  status: text("status", { enum: ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] })
    .notNull()
    .default("DRAFT"),
  subtype: text("subtype", {
    enum: automationStepSubtypes,
  }).notNull(),
  parentId: text("parentId", { length: 32 }).references(
    (): AnySQLiteColumn => automationSteps.id,
    { onDelete: "cascade" },
  ),
  branchIndex: int("branchIndex"), // used for if / else or split or branch automation point types.
  configuration: text("configuration", { mode: "json" })
    .$type<Record<string, any>>()
    .notNull(),

  // an automation step of type SEND_EMAIL must have this emailId
  emailId: text("emailId", { length: 32 }).references(() => emails.id),

  // an automation step of type ADD_TAG OR REMOVE_TAG must have this tagId field
  tagId: text("tagId", { length: 32 }).references(() => tags.id),

  // an automation step of type ADD_AUDIENCE or REMOVE_FROM_AUDIENCE must have this audienceId field
  audienceId: text("audienceId", { length: 32 }).references(() => audiences.id),
})

/*

This table stores a user's progress through the automation.

Automation run is triggered every 10 minutes.

When triggered, automation fetches all contacts that match the trigger conditions.
    OR -> Automation run is manually triggered by an event happening in the system, such as a contact getting a tag.
-> Loop through each contact pass in the contact , automation (with its steps), contact_automation steps progress to the automation executor.

-> The executor figures out if the contact is eligible for any actions at that time, then executes. 
-> If not, skips the automation process for that user. 
-> It also updates the state of the contact: halted, waiting, completed, failed, etc.

-> Generates automation summary after execution.

*/

// say user completed 5 of 9

// i delete number 4. now user has completed 4 of 8

// but how do we proceed ?

// simple. we get latest known completed step for contact, and find next based on new automation flow.

// if they were waiting somewhere and that step is deleted, sure no problem.

// to run automation step, we run a paginated query to fetch all contacts that match the trigger conditions.
// then cursor through the contacts. for each contact, we execute the automation. we can execute maybe 4 contacts at a time or similar.

// we can also execute the automation in series. but that will be slow. we can also execute the automation in parallel. but that will be fast but will require more resources. so we can have a hybrid approach. we can execute the automation in parallel but limit the number of parallel executions.

export const contactAutomationStep = sqliteTable("contactAutomationSteps", {
  id,

  automationStepId: text("automationStepId", { length: 32 })
    .references(() => automationSteps.id, { onDelete: "cascade" })
    .notNull(),

  contactId: text("contactId", { length: 32 })
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),

  haltedAt: integer("haltedAt"),
  failedAt: integer("failedAt"),
  startedAt: integer("startedAt"), // for wait steps, this will be start of wait
  completedAt: integer("completedAt"), // for wait steps, this will be end of wait

  output: text("output", { mode: "json" }),
})

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
      relationName: "steps",
    }),
    steps: many(automationSteps, {
      relationName: "steps",
    }),
  }),
)
