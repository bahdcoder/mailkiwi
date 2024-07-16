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

// Tables
export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  url: varchar("url", { length: 256 }).unique(),
  domain: varchar("domain", { length: 50 }).unique().notNull(),
  installedSslCertificate: boolean("installedSslCertificate")
    .default(false)
    .notNull(),
})

export const users = mysqlTable("users", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  email: varchar("email", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 50 }),
  avatarUrl: varchar("avatarUrl", { length: 256 }),
  password: varchar("password", { length: 256 }).notNull(),
})

export const accessTokens = mysqlTable("accessTokens", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
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
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
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
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
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
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  mailerId: varchar("mailerId", { length: 32 }).references(() => mailers.id),
  value: varchar("value", { length: 50 }).notNull(),
  type: MailerIdentityType.notNull(),
  status: MailerIdentityStatus.default("PENDING").notNull(),
  configuration: json("configuration"),
  confirmedApprovalAt: timestamp("confirmedApprovalAt"),
})

export const webhooks = mysqlTable("webhooks", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  name: varchar("name", { length: 50 }).notNull(),
  url: varchar("url", { length: 256 }).notNull(),
  events: WebhookEvent,
  teamId: varchar("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable("teamMemberships", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
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
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  name: varchar("name", { length: 50 }).notNull(),
  teamId: varchar("teamId", { length: 32 })
    .references(() => teams.id)
    .notNull(),
})

export const contacts = mysqlTable(
  "Contact",
  {
    id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
    firstName: varchar("firstName", { length: 50 }),
    lastName: varchar("lastName", { length: 50 }),
    email: varchar("email", { length: 50 }).notNull(),
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

export const tags = mysqlTable("Tag", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 256 }),
})

export const tagsOnContacts = mysqlTable(
  "TagsOnContacts",
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
    TagsOnContacts_tagId_contactId_key: uniqueIndex(
      "TagsOnContacts_tagId_contactId_key",
    ).on(table.tagId, table.contactId),
    TagsOnContacts_tagId_contactId_idx: index(
      "TagsOnContacts_tagId_contactId_idx",
    ).on(table.tagId, table.contactId),
  }),
)

export const journeys = mysqlTable("journeys", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 512 }),
  audienceId: varchar("audienceId", { length: 32 })
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
})

const JourneyPointType = mysqlEnum("JourneyPointType", [
  "TRIGGER",
  "ACTION",
  "RULE",
  "END",
])

const JourneyPointStatus = mysqlEnum("JourneyPointStatus", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
])

const JourneyPointSubtype = mysqlEnum("JourneyPointSubtype", [
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
  "END", // end of the journey for the contact.
])

export const journeyPoints = mysqlTable("journey_points", {
  id: varchar("id", { length: 32 }).primaryKey().notNull().$defaultFn(cuid),
  journeyId: varchar("journeyId", { length: 32 })
    .references(() => journeys.id)
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 512 }),
  type: JourneyPointType.notNull(),
  status: JourneyPointStatus.notNull().default("DRAFT"),
  subtype: JourneyPointSubtype.notNull(),
  parentId: varchar("parentId", { length: 32 }).references(
    (): AnyMySqlColumn => journeyPoints.id,
    { onDelete: "cascade" },
  ),
  branchIndex: int("branchIndex"), // used for if / else or split or branch journey point types.
  configuration: json("configuration").notNull(),
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

export const journeyRelations = relations(journeys, ({ one, many }) => ({
  audience: one(audiences, {
    fields: [journeys.audienceId],
    references: [audiences.id],
  }),
  points: many(journeyPoints),
}))

export const journeyPointsRelations = relations(
  journeyPoints,
  ({ one, many }) => ({
    journey: one(journeys, {
      fields: [journeyPoints.journeyId],
      references: [journeys.id],
    }),
    parent: one(journeyPoints, {
      fields: [journeyPoints.parentId],
      references: [journeyPoints.id],
      relationName: "pointsInPath",
    }),
    points: many(journeyPoints, {
      relationName: "pointsInPath",
    }),
  }),
)
