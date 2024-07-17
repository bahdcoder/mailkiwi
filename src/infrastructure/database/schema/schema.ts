import { relations } from "drizzle-orm"
import {
  AnyMySqlColumn,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"

import { cuid } from "@/domains/shared/utils/cuid/cuid.ts"

function id() {
  return varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid)
}

// Enums
export const BroadcastEditor = mysqlEnum("BroadcastEditor", [
  "DEFAULT",
  "MARKDOWN",
])

export const MailerStatus = mysqlEnum("MailerStatus", [
  "READY",
  "PENDING",
  "INSTALLING",
  "CREATING_IDENTITIES",
  "SENDING_TEST_EMAIL",
  "DISABLED",
  "ACCESS_KEYS_LOST_PROVIDER_ACCESS",
])
export const MailerProvider = mysqlEnum("MailerProvider", [
  "AWS_SES",
  "POSTMARK",
  "MAILGUN",
])
export const MailerIdentityStatus = mysqlEnum("MailerIdentityStatus", [
  "PENDING",
  "APPROVED",
  "DENIED",
  "FAILED",
  "TEMPORARILY_FAILED",
])
export const MailerIdentityType = mysqlEnum("MailerIdentityType", [
  "EMAIL",
  "DOMAIN",
])
export const WebhookEvent = mysqlEnum("WebhookEvent", [
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
])
export const TeamRole = mysqlEnum("TeamRole", ["ADMINISTRATOR", "USER"])
export const MembershipStatus = mysqlEnum("MembershipStatus", [
  "PENDING",
  "ACTIVE",
])

export const ContactAutomationAutomationStep = mysqlEnum(
  "ContactAutomationAutomationStep",
  ["NOT_STARTED", "RUNNING", "FAILED", "COMPLETED"],
)

// Tables
export const settings = mysqlTable("settings", {
  id: id(),
  url: varchar("url", { length: 256 }).unique(),
  domain: varchar("domain", { length: 50 }).unique().notNull(),
  installedSslCertificate: boolean("installedSslCertificate")
    .default(false)
    .notNull(),
})

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 80 }).unique().notNull(),
  name: varchar("name", { length: 80 }),
  avatarUrl: varchar("avatarUrl", { length: 256 }),
  password: varchar("password", { length: 256 }).notNull(),
})

export const accessTokens = mysqlTable("accessTokens", {
  id: id(),
  userId: varchar("userId", { length: 32 }).references(() => users.id),
  teamId: varchar("teamId", { length: 32 }).references(() => teams.id),
  type: varchar("type", { length: 16 }).notNull(),
  name: varchar("name", { length: 32 }),
  hash: varchar("hash", { length: 100 }).notNull(),
  // abilities: varchar("abilities", {length: 256}).array().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").defaultNow().notNull(),
})

export const teams = mysqlTable("teams", {
  id: id(),
  name: varchar("name", { length: 100 }).notNull(),
  userId: varchar("userId", { length: 32 })
    .notNull()
    .references(() => users.id),
  trackClicks: boolean("trackClicks"),
  trackOpens: boolean("trackOpens"),
  configurationKey: varchar("configurationKey", { length: 512 }).notNull(),
  broadcastEditor: BroadcastEditor,
})

export const mailers = mysqlTable("mailers", {
  id: id(),
  name: varchar("name", { length: 50 }).notNull(),
  configuration: varchar("configuration", { length: 512 }).notNull(),
  default: boolean("default"),
  provider: MailerProvider.notNull(),
  status: MailerStatus.default("PENDING").notNull(),
  teamId: varchar("teamId", { length: 512 })
    .references(() => teams.id)
    .unique()
    .notNull(),
  sendingEnabled: boolean("sendingEnabled").default(false).notNull(),
  inSandboxMode: boolean("inSandboxMode").default(true).notNull(),
  max24HourSend: int("max24HourSend"),
  maxSendRate: int("maxSendRate"),
  sentLast24Hours: int("sentLast24Hours"),
  testEmailSentAt: timestamp("testEmailSentAt"),
  installationCompletedAt: timestamp("installationCompletedAt"),
})

export const mailerIdentities = mysqlTable("mailerIdentities", {
  id: id(),
  mailerId: varchar("mailerId", { length: 32 }).references(() => mailers.id),
  value: varchar("value", { length: 50 }).notNull(),
  type: MailerIdentityType.notNull(),
  status: MailerIdentityStatus.default("PENDING").notNull(),
  configuration: json("configuration"),
  confirmedApprovalAt: timestamp("confirmedApprovalAt"),
})

export const webhooks = mysqlTable("webhooks", {
  id: id(),
  name: varchar("name", { length: 50 }).notNull(),
  url: varchar("url", { length: 256 }).notNull(),
  events: WebhookEvent,
  teamId: varchar("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable("teamMemberships", {
  id: id(),
  userId: varchar("userId", { length: 32 }).references(() => users.id),
  email: varchar("email", { length: 50 }).notNull(),
  teamId: varchar("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
  role: TeamRole,
  status: MembershipStatus,
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
})

export const audiences = mysqlTable("audiences", {
  id: id(),
  name: varchar("name", { length: 50 }).notNull(),
  teamId: varchar("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const contacts = mysqlTable(
  "contacts",
  {
    id: id(),
    firstName: varchar("firstName", { length: 50 }),
    lastName: varchar("lastName", { length: 50 }),
    email: varchar("email", { length: 80 }).notNull(),
    avatarUrl: varchar("avatarUrl", { length: 256 }),
    subscribedAt: timestamp("subscribedAt"),
    unsubscribedAt: timestamp("unsubscribedAt"),
    audienceId: varchar("audienceId", { length: 32 })
      .references(() => audiences.id)
      .notNull(),
    attributes: json("attributes"),
  },
  (table) => ({
    Contact_email_audienceId_key: uniqueIndex(
      "Contact_email_audienceId_key",
    ).on(table.email, table.audienceId),
  }),
)

export const tags = mysqlTable("tags", {
  id: id(),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 256 }),
  audienceId: varchar("audienceId", { length: 32 })
    .references(() => audiences.id)
    .notNull(),
})

export const tagsOnContacts = mysqlTable(
  "tagsOnContacts",
  {
    tagId: varchar("tagId", { length: 32 })
      .references(() => tags.id)
      .notNull(),
    contactId: varchar("contactId", { length: 32 })
      .references(() => contacts.id)
      .notNull(),
    assignedAt: timestamp("assignedAt"),
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

export const automations = mysqlTable("automations", {
  id: id(),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 512 }),
  audienceId: varchar("audienceId", { length: 32 })
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
})

const automationStepType = mysqlEnum("automationStepType", [
  "TRIGGER",
  "ACTION",
  "RULE",
  "END",
])

const automationStepStatus = mysqlEnum("automationStepStatus", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
])

const automationStepSubtype = mysqlEnum("automationStepSubtype", [
  // TRIGGERS
  "TRIGGER_CONTACT_SUBSCRIBED",
  "TRIGGER_CONTACT_UNSUBSCRIBED",
  "TRIGGER_CONTACT_TAG_ADDED",
  "TRIGGER_CONTACT_TAG_REMOVED",
  "TRIGGER_API_MANUAL",

  // ACTIONS
  "ACTION_SEND_EMAIL",
  "ACTION_ADD_TAG",
  "ACTION_REMOVE_TAG",
  "ACTION_SUBSCRIBE_TO_AUDIENCE",
  "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
  "ACTION_UPDATE_CONTACT",
  "ACTION_UPDATE_CONTACT_ATTRIBUTES",
  "ACTION_UPDATE_CONTACT_TAGS",

  // RULES
  "RULE_IF_ELSE",
  "RULE_WAIT_FOR_DURATION",
  "RULE_PERCENTAGE_SPLIT",
  "RULE_WAIT_FOR_TRIGGER",

  // END
  "END", // end of the automation for the contact.
])

export const automationSteps = mysqlTable("automation_steps", {
  id: id(),
  automationId: varchar("automationId", { length: 32 })
    .references(() => automations.id)
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 512 }),
  type: automationStepType.notNull(),
  status: automationStepStatus.notNull().default("DRAFT"),
  subtype: automationStepSubtype.notNull(),
  parentId: varchar("parentId", { length: 32 }).references(
    (): AnyMySqlColumn => automationSteps.id,
    { onDelete: "cascade" },
  ),
  branchIndex: int("branchIndex"), // used for if / else or split or branch automation point types.
  configuration: json("configuration").notNull(),
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

export const contactAutomationStep = mysqlTable("contactAutomationSteps", {
  id: id(),

  automationStepId: varchar("automationStepId", { length: 32 })
    .references(() => automationSteps.id, { onDelete: "cascade" })
    .notNull(),

  contactId: varchar("contactId", { length: 32 })
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),

  haltedAt: timestamp("haltedAt"),
  failedAt: timestamp("failedAt"),
  startedAt: timestamp("startedAt"), // for wait steps, this will be start of wait
  completedAt: timestamp("completedAt"), // for wait steps, this will be end of wait

  output: json("output"),
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
