import { relations } from "drizzle-orm"
import {
  type AnyMySqlColumn,
  bigint,
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
} from "drizzle-orm/mysql-core"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

const primaryKeyBigInt = <TName extends string>(name: TName) =>
  bigint(name, { mode: "number", unsigned: true })

const id = primaryKeyBigInt("id").primaryKey().autoincrement()

export type ContactFilterCondition = {
  field: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["field"]
  operation: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["operation"]
  value: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["value"]
}

export type ContactFilterGroup = {
  type: "AND" | "OR"
  conditions: ContactFilterCondition[]
}

export type ContactFilterGroups = {
  type: "AND" | "OR"
  groups: ContactFilterGroup[]
}

// Tables
export const settings = mysqlTable("settings", {
  id,
  url: varchar("url", { length: 256 }).unique(),
  domain: varchar("domain", { length: 50 }).unique().notNull(),
  installedSslCertificate: boolean("installedSslCertificate")
    .default(false)
    .notNull(),
})

export const users = mysqlTable("users", {
  id,
  email: varchar("email", { length: 80 }).unique().notNull(),
  name: varchar("name", { length: 80 }),
  avatarUrl: varchar("avatarUrl", { length: 256 }),
  password: varchar("password", { length: 256 }).notNull(),
})

export const accessTokens = mysqlTable("accessTokens", {
  id,
  userId: primaryKeyBigInt("userId").references(() => users.id),
  teamId: primaryKeyBigInt("teamId").references(() => teams.id),
  name: varchar("name", { length: 32 }),
  hash: varchar("hash", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").defaultNow().notNull(),
})

export const teams = mysqlTable("teams", {
  id,
  name: varchar("name", { length: 100 }).notNull(),
  userId: primaryKeyBigInt("userId")
    .notNull()
    .references(() => users.id),
  trackClicks: boolean("trackClicks"),
  trackOpens: boolean("trackOpens"),
  broadcastEditor: mysqlEnum("broadcastEditor", ["DEFAULT", "MARKDOWN"]),
})

export const sendingDomains = mysqlTable("sendingDomains", {
  id,
  name: varchar("name", { length: 100 }).notNull(),
  teamId: primaryKeyBigInt("teamId")
    .notNull()
    .references(() => teams.id),
  dkimSubDomain: varchar("dkimSubDomain", {
    length: 120,
  }).notNull(),
  dkimPublicKey: text("dkimPublicKey").notNull(),
  dkimPrivateKey: text("dkimPrivateKey").notNull(),
  returnPathSubDomain: varchar("returnPathSubDomain", {
    length: 120,
  }).notNull(),
  returnPathDomainCnameValue: varchar("returnPathDomainCnameValue", {
    length: 120,
  }).notNull(),
  dkimVerifiedAt: timestamp("dkimVerifiedAt"),
  returnPathDomainVerifiedAt: timestamp("returnPathDomainVerifiedAt"),
})

export const webhooks = mysqlTable("webhooks", {
  id,
  name: varchar("name", { length: 50 }).notNull(),
  url: varchar("url", { length: 256 }).notNull(),
  events: mysqlEnum("webhookEvent", [
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
  ]),
  teamId: primaryKeyBigInt("teamId")
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable("teamMemberships", {
  id,
  userId: primaryKeyBigInt("userId").references(() => users.id),
  email: varchar("email", { length: 50 }).notNull(),
  teamId: primaryKeyBigInt("teamId")
    .references(() => teams.id)
    .notNull(),
  role: mysqlEnum("role", ["ADMINISTRATOR", "MANAGER", "AUTHOR", "GUEST"]),
  status: mysqlEnum("status", ["PENDING", "ACTIVE"]),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  // invite expiration
  expiresAt: timestamp("expiresAt").notNull(),
})

export const audiences = mysqlTable("audiences", {
  id,
  name: varchar("name", { length: 50 }).notNull(),
  teamId: primaryKeyBigInt("teamId")
    .references(() => teams.id)
    .notNull(),
  knownAttributesKeys: json("knownAttributes").$type<string[]>(),
})

export const contactImports = mysqlTable("contactImports", {
  id,
  fileIdentifier: varchar("fileIdentifier", { length: 32 })
    .unique()
    .notNull(),
  name: varchar("name", { length: 50 }),
  audienceId: primaryKeyBigInt("audienceId")
    .references(() => audiences.id)
    .notNull(),
  uploadUrl: varchar("url", { length: 100 }).notNull(),
  status: mysqlEnum("status", [
    "PENDING",
    "PROCESSING",
    "FAILED",
    "SUCCESS",
  ]),
  subscribeAllContacts: boolean("subscribeAllContacts").default(true),
  updateExistingContacts: boolean("updateExistingContacts").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  attributesMap: json("attributesMap")
    .$type<{
      email: string
      firstName: string
      lastName: string
      headers: string[]
      attributes: string[]
      tags: string[] // for each of these, save a new tag to the tags table for this audience.
      tagIds: number[]
    }>()
    .notNull(),
})

export const contacts = mysqlTable(
  "contacts",
  {
    id,
    firstName: varchar("firstName", { length: 50 }),
    lastName: varchar("lastName", { length: 50 }),
    email: varchar("email", { length: 80 }).notNull(),
    avatarUrl: varchar("avatarUrl", { length: 256 }),
    subscribedAt: timestamp("subscribedAt"),
    unsubscribedAt: timestamp("unsubscribedAt"),
    audienceId: primaryKeyBigInt("audienceId")
      .references(() => audiences.id)
      .notNull(),
    emailVerificationToken: varchar("emailVerificationToken", {
      length: 100,
    }),
    emailVerificationTokenExpiresAt: timestamp(
      "emailVerificationTokenExpiresAt",
    ),
    contactImportId: primaryKeyBigInt("contactImportId").references(
      () => contactImports.id,
    ),
    attributes: json("attributes").$type<Record<string, any>>(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    ContactEmailAudienceIdKey: unique("ContactEmailAudienceIdKey").on(
      table.email,
      table.audienceId,
    ),
  }),
)

export const tags = mysqlTable(
  "tags",
  {
    id,
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 256 }),
    audienceId: primaryKeyBigInt("audienceId")
      .references(() => audiences.id)
      .notNull(),
  },
  (table) => ({
    tagNameAudienceIdKey: unique("tagNameAudienceIdKey").on(
      table.name,
      table.audienceId,
    ),
  }),
)

export const tagsOnContacts = mysqlTable(
  "tagsOnContacts",
  {
    id,
    tagId: primaryKeyBigInt("tagId")
      .references(() => tags.id)
      .notNull(),
    contactId: primaryKeyBigInt("contactId")
      .references(() => contacts.id)
      .notNull(),
    assignedAt: timestamp("assignedAt"),
  },
  (table) => ({
    tagsOnContactsTagIdContactIdKey: unique(
      "tagsOnContactsTagIdContactIdKey",
    ).on(table.tagId, table.contactId),
    tagsOnContactsTagIdContactIdIdx: index(
      "tagsOnContactsTagIdContactIdIdx",
    ).on(table.tagId, table.contactId),
  }),
)

export const automations = mysqlTable("automations", {
  id,
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 512 }),
  audienceId: primaryKeyBigInt("audienceId")
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
})

export const emails = mysqlTable("emails", {
  id,
  type: mysqlEnum("type", ["AUTOMATION", "TRANSACTIONAL"]).notNull(),
  title: varchar("title", { length: 50 }).notNull(),
  audienceId: primaryKeyBigInt("audienceId")
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
  emailContentId: primaryKeyBigInt("emailContentId").references(
    () => emailContents.id,
    {
      onDelete: "cascade",
    },
  ),
})

export const abTestVariants = mysqlTable("abTestVariants", {
  id,
  broadcastId: primaryKeyBigInt("broadcastId")
    .references(() => broadcasts.id, {
      onDelete: "cascade",
    })
    .notNull(),
  emailContentId: primaryKeyBigInt("emailContentId")
    .references(() => emailContents.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  weight: int("weight").default(1).notNull(), // in percentages.
  sendAt: timestamp("sendAt").$type<Date | undefined>(),
})

export const emailContents = mysqlTable("emailContents", {
  id,
  fromName: varchar("fromName", { length: 255 }),
  fromEmail: varchar("fromEmail", { length: 255 }),
  replyToEmail: varchar("replyToEmail", { length: 255 }),
  replyToName: varchar("replyToName", { length: 255 }),
  contentJson: json("contentJson"),
  contentText: text("contentText"),
  contentHtml: text("contentHtml"),
  subject: varchar("subject", { length: 255 }),
  previewText: varchar("previewText", { length: 255 }),
})

export const broadcasts = mysqlTable("broadcasts", {
  id,
  name: varchar("name", { length: 255 }).notNull(),

  audienceId: primaryKeyBigInt("audienceId")
    .references(() => audiences.id)
    .notNull(),
  segmentId: primaryKeyBigInt("segmentId").references(() => segments.id),
  teamId: primaryKeyBigInt("teamId")
    .references(() => teams.id)
    .notNull(),
  trackClicks: boolean("trackClicks"),
  trackOpens: boolean("trackOpens"),

  emailContentId: primaryKeyBigInt("emailContentId").references(
    () => emailContents.id,
    {
      onDelete: "cascade",
    },
  ),
  winningAbTestVariantId: primaryKeyBigInt(
    "winningAbTestVariantId",
  ).references((): AnyMySqlColumn => abTestVariants.id, {
    onDelete: "cascade",
  }),
  // waitingTimeToPickWinner
  waitingTimeToPickWinner: int("waitingTimeToPickWinner").default(4), // in hours,
  status: mysqlEnum("status", [
    "SENT",
    "SENDING",
    "DRAFT",
    "QUEUED_FOR_SENDING",
    "SENDING_FAILED",
    "DRAFT_ARCHIVED",
    "ARCHIVED",
  ]).default("DRAFT"),
  isAbTest: boolean("isAbTest").default(false).notNull(),
  winningCriteria: mysqlEnum("winningCriteria", [
    "OPENS",
    "CLICKS",
    "CONVERSIONS",
  ]),
  winningWaitTime: int("winningWaitTime"), // in hours
  sendAt: timestamp("sendAt").$type<Date | undefined>(),
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

export const automationStepTypes = [
  "TRIGGER",
  "ACTION",
  "RULE",
  "END",
] as const
export const automationStepSubtypes = [
  ...automationStepSubtypesTrigger,
  ...automationStepSubtypesAction,
  ...automationStepSubtypesRule,
  ...automationStepSubtypesEnd,
] as const

export type ACTION_ADD_TAG_CONFIGURATION = {
  tagIds: number[]
}
export type ACTION_REMOVE_TAG_CONFIGURATION = {
  tagIds: number[]
}
export type ACTION_UPDATE_CONTACT_ATTRIBUTES = {
  attributes: Record<string, any>
}
export type ACTION_SEND_EMAIL_CONFIGURATION = {
  emailId: number
}

export type RULE_WAIT_FOR_DURATION_CONFIGURATION = {
  delay: number
}

export type RULE_IF_ELSE_CONFIGURATION = {
  filterGroups: ContactFilterGroups
}

export type TRIGGER_CONFIGURATION = {
  filterGroups: ContactFilterGroups
}

export type END_CONFIGURATION = {
  type: "END"
}

export type ACTION_SUBSCRIBE_TO_AUDIENCE_CONFIGURATION = {
  audienceId: number
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

export const automationSteps = mysqlTable("automationSteps", {
  id,
  automationId: primaryKeyBigInt("automationId")
    .references(() => automations.id)
    .notNull(),
  type: mysqlEnum("type", automationStepTypes).notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
    .notNull()
    .default("DRAFT"),
  subtype: mysqlEnum("subtype", automationStepSubtypes).notNull(),
  parentId: primaryKeyBigInt("parentId").references(
    (): AnyMySqlColumn => automationSteps.id,
    {
      onDelete: "cascade",
    },
  ),
  branchIndex: int("branchIndex"),
  configuration: json("configuration")
    .$type<AutomationStepConfiguration>()
    .notNull(),
  emailId: primaryKeyBigInt("emailId").references(() => emails.id),
  tagId: primaryKeyBigInt("tagId").references(() => tags.id),
  audienceId: primaryKeyBigInt("audienceId").references(
    () => audiences.id,
  ),
})

export const segments = mysqlTable("segments", {
  id,
  name: varchar("name", { length: 255 }).notNull(),
  audienceId: primaryKeyBigInt("audienceId")
    .references(() => audiences.id)
    .notNull(),
  filterGroups: json("filterGroups")
    .$type<ContactFilterGroups>()
    .notNull(),
})

export const contactAutomationSteps = mysqlTable(
  "contactAutomationSteps",
  {
    id,
    automationStepId: primaryKeyBigInt("automationStepId")
      .references(() => automationSteps.id, {
        onDelete: "cascade",
      })
      .notNull(),
    contactId: primaryKeyBigInt("contactId")
      .references(() => contacts.id, {
        onDelete: "cascade",
      })
      .notNull(),
    status: mysqlEnum("status", [
      "PENDING",
      "ACTIVE",
      "COMPLETED",
      "FAILED",
      "HALTED",
    ]).default("PENDING"),
    haltedAt: timestamp("haltedAt"),
    failedAt: timestamp("failedAt"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt"),
    output: json("output").$type<string[]>(),
  },
)

// Relations remain the same as in the original file

// Relations
export const userRelations = relations(users, ({ many }) => ({
  teams: many(teams),
  accessTokens: many(accessTokens),
  memberships: many(teamMemberships),
}))

export const teamRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.userId],
    references: [users.id],
  }),
  members: many(teamMemberships),
  webhooks: many(webhooks),
  accessTokens: many(accessTokens),
  audiences: many(audiences),
}))

export const accessTokenRelations = relations(accessTokens, ({ one }) => ({
  user: one(users, {
    fields: [accessTokens.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [accessTokens.teamId],
    references: [teams.id],
  }),
}))

export const broadcastRelations = relations(
  broadcasts,
  ({ one, many }) => ({
    audience: one(audiences, {
      fields: [broadcasts.audienceId],
      references: [audiences.id],
    }),
    emailContent: one(emailContents, {
      fields: [broadcasts.emailContentId],
      references: [emailContents.id],
    }),
    team: one(teams, {
      fields: [broadcasts.teamId],
      references: [teams.id],
    }),
    segment: one(segments, {
      fields: [broadcasts.segmentId],
      references: [segments.id],
    }),
    abTestVariants: many(abTestVariants, {
      relationName: "abTestVariants",
    }),
    winningAbTestVariant: one(abTestVariants, {
      fields: [broadcasts.winningAbTestVariantId],
      references: [abTestVariants.id],
    }),
  }),
)

export const abTestVariantRelations = relations(
  abTestVariants,
  ({ one }) => ({
    broadcast: one(broadcasts, {
      fields: [abTestVariants.broadcastId],
      references: [broadcasts.id],
      relationName: "abTestVariants",
    }),
    emailContent: one(emailContents, {
      fields: [abTestVariants.emailContentId],
      references: [emailContents.id],
    }),
  }),
)

export const emailRelations = relations(emails, ({ one }) => ({
  emailContent: one(emailContents, {
    fields: [emails.emailContentId],
    references: [emailContents.id],
  }),
}))

export const WebhookRelations = relations(webhooks, ({ one }) => ({
  team: one(teams, {
    fields: [webhooks.teamId],
    references: [teams.id],
  }),
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
  team: one(teams, {
    fields: [audiences.teamId],
    references: [teams.id],
  }),
  contacts: many(contacts),
  imports: many(contactImports),
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

export const TagsOnContactsRelations = relations(
  tagsOnContacts,
  ({ one }) => ({
    tag: one(tags, {
      fields: [tagsOnContacts.tagId],
      references: [tags.id],
    }),
    contact: one(contacts, {
      fields: [tagsOnContacts.contactId],
      references: [contacts.id],
    }),
  }),
)

export const automationRelations = relations(
  automations,
  ({ one, many }) => ({
    audience: one(audiences, {
      fields: [automations.audienceId],
      references: [audiences.id],
    }),
    steps: many(automationSteps),
  }),
)

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
