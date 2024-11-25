import { CreateFormDto } from "@/forms/dto/create_form_dto.js"
import { SubmitFormDto } from "@/forms/dto/submit_form_dto.js"
import { UpdateWebsitePageDto } from "@/websites/dto/update_website_page_dto.js"
import { sql } from "drizzle-orm"
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
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"
import { v1 } from "uuid"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.js"

export const binaryUuid = customType<{
  data: string
  driverData: Buffer
  config: { length?: number }
}>({
  dataType(config) {
    return typeof config?.length !== "undefined"
      ? `binary(${config.length})`
      : `binary`
  },
  fromDriver(buf) {
    return [
      buf.toString("hex", 4, 8),
      buf.toString("hex", 2, 4),
      buf.toString("hex", 0, 2),
      buf.toString("hex", 8, 10),
      buf.toString("hex", 10, 16),
    ].join("-")
  },
  toDriver(value: string) {
    return uuidToBin(value)
  },
})

export const uuidToBin = (uuid: string) => sql`UUID_TO_BIN(${uuid}, 1)`

const primaryKeyCuid = <TName extends string>(name: TName) =>
  binaryUuid(name, { length: 16 })

const id = primaryKeyCuid("id").primaryKey().$defaultFn(v1)

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

export type KnownAudienceProperty = {
  id: string
  label: string
  options?: string[]
  type: "boolean" | "float" | "date" | "text" | "enum" | "list"
}

export const settings = mysqlTable("settings", {
  id,
  // encrypted id used by acme client for generating acme certificates.
  acmeAccountIdentity: text("acmeAccountIdentity").notNull(),
})

export const users = mysqlTable("users", {
  id,
  email: varchar("email", { length: 80 }).unique().notNull(),
  name: varchar("name", { length: 80 }),
  avatarUrl: varchar("avatarUrl", { length: 256 }),
  password: varchar("password", { length: 256 }).notNull(),
})

export const sendingSources = mysqlTable("sendingSources", {
  id,
  status: mysqlEnum("status", ["inactive", "active", "warming"]).$default(
    () => "inactive",
  ),
  address: varchar("address", { length: 80 }).notNull().unique(),
  ehloDomain: varchar("ehloDomain", { length: 80 }).notNull().unique(),
  proxyServer: varchar("proxyServer", { length: 80 }),
  addressIpv6: varchar("addressIpv6", { length: 120 }).unique(),
  pool: mysqlEnum("pool", ["engage", "send"]).notNull(),
})

export const accessTokens = mysqlTable("accessTokens", {
  id,
  userId: primaryKeyCuid("userId").references(() => users.id),
  teamId: primaryKeyCuid("teamId").references(() => teams.id),
  name: varchar("name", { length: 32 }),
  accessKey: varchar("accessKey", { length: 255 }),
  capabilities: json("capabilities").$type<string[]>(),
  accessSecret: varchar("accessSecret", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").defaultNow().notNull(),
})

export const teams = mysqlTable("teams", {
  id,
  name: varchar("name", { length: 100 }).notNull(),
  userId: primaryKeyCuid("userId")
    .notNull()
    .references(() => users.id),
  trackClicks: boolean("trackClicks"),
  trackOpens: boolean("trackOpens"),
  broadcastEditor: mysqlEnum("broadcastEditor", ["DEFAULT", "MARKDOWN"]),
  commerceProvider: mysqlEnum("commerceProvider", [
    "stripe",
    "paystack",
    "flutterwave",
  ]),
  commerceProviderAccountId: varchar("commerceProviderAccountId", {
    length: 255,
  }),
  commerceProviderConfirmedAt: timestamp("commerceProviderConfirmedAt"),
})

export const sendingDomains = mysqlTable("sendingDomains", {
  id,
  name: varchar("name", { length: 100 }).notNull(),
  teamId: primaryKeyCuid("teamId")
    .notNull()
    .references(() => teams.id),

  // Dkim
  dkimSubDomain: varchar("dkimSubDomain", {
    length: 120,
  }).notNull(),
  dkimPublicKey: text("dkimPublicKey").notNull(),
  dkimPrivateKey: text("dkimPrivateKey").notNull(),
  dkimVerifiedAt: timestamp("dkimVerifiedAt"),

  // return path
  returnPathSubDomain: varchar("returnPathSubDomain", {
    length: 120,
  }).notNull(),
  returnPathDomainCnameValue: varchar("returnPathDomainCnameValue", {
    length: 120,
  }).notNull(),
  returnPathDomainVerifiedAt: timestamp("returnPathDomainVerifiedAt"),

  // sending ip addresses
  sendingSourceId: primaryKeyCuid("sendingSourceId").references(
    () => sendingSources.id,
  ),
  secondarySendingSourceId: primaryKeyCuid(
    "secondarySendingSourceId",
  ).references(() => sendingSources.id),
  engageSendingSourceId: primaryKeyCuid(
    "engageSendingSourceId",
  ).references(() => sendingSources.id),
  engageSecSendingSourceId: primaryKeyCuid(
    "engageSecSendingSourceId",
  ).references(() => sendingSources.id),

  // tracking
  trackingDomainCnameValue: varchar("trackingDomainCnameValue", {
    length: 120,
  }).notNull(),
  trackingSubDomain: varchar("trackingSubDomain", {
    length: 120,
  }).notNull(),

  trackingDomainVerifiedAt: timestamp("trackingDomainVerifiedAt"),
  trackingDomainSslVerifiedAt: timestamp("trackingDomainSslVerifiedAt"),

  trackingSslCertKey: text("trackingSslCertKey"),
  trackingSslCertSecret: text("trackingSslCertSecret"),

  openTrackingEnabled: boolean("openTrackingEnabled").default(false),
  clickTrackingEnabled: boolean("clickTrackingEnabled").default(false),

  // product
  product: mysqlEnum("product", ["engage", "send"]).default("engage"), // an engage domain will only be used
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
  teamId: primaryKeyCuid("teamId")
    .references(() => teams.id)
    .notNull(),
})

export const teamMemberships = mysqlTable("teamMemberships", {
  id,
  userId: primaryKeyCuid("userId").references(() => users.id),
  email: varchar("email", { length: 50 }).notNull(),
  teamId: primaryKeyCuid("teamId")
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
  teamId: primaryKeyCuid("teamId")
    .references(() => teams.id)
    .notNull(),
  knownProperties:
    json("knownProperties").$type<KnownAudienceProperty[]>(),
  product: mysqlEnum("product", ["engage", "letters"]).default("engage"),
})

export const websites = mysqlTable("websites", {
  id,
  teamId: primaryKeyCuid("teamId")
    .references(() => teams.id)
    .notNull(),
  slug: varchar("slug", { length: 72 }), // the subdomain of this specific newsletter website
  // Custom domain for website

  // Example: fastmedia.kibaletters.com -> fastmedia is the current website slug.
  // cname will be domain, example news.fastmedia.com, cname value will be fastmedia.kibaletters.com
  websiteDomain: varchar("websiteDomain", { length: 120 }).unique(),
  websiteDomainCnameValue: varchar("websiteDomainCnameValue", {
    length: 120,
  }),

  // when the cname was confirmed by background jobs
  websiteDomainVerifiedAt: timestamp("websiteDomainVerifiedAt"),
  // when the ssl certificate was issued and confirmed
  websiteDomainSslVerifiedAt: timestamp("websiteDomainSslVerifiedAt"),

  // the cert key and cert secretAccessKey
  // (encrypted) -> will be automatically added to the load balancer to automate ssl termination
  websiteSslCertKey: text("websiteSslCertKey"),
  websiteSslCertSecret: text("websiteSslCertSecret"),

  websiteSslCertChallengeToken: varchar("websiteSslCertChallengeToken", {
    length: 256,
  }),
  websiteSslCertChallengeKeyAuthorization: text(
    "websiteSslCertChallengeKeyAuthorization",
  ),
})

export const websitePages = mysqlTable(
  "websitePages",
  {
    id,
    title: varchar("title", { length: 72 }),
    path: varchar("path", { length: 72 }), // the path on the website

    description: text("description"),

    websiteId: primaryKeyCuid("websiteId").references(() => websites.id),
    websiteContent: json("websiteContent")
      .$type<UpdateWebsitePageDto["draftWebsiteContent"]>()
      .notNull(),
    draftWebsiteContent: json("draftWebsiteContent")
      .$type<UpdateWebsitePageDto["draftWebsiteContent"]>()
      .notNull(),

    publishedAt: timestamp("publishedAt"),
  },
  (table) => ({
    websiteIdPathKey: unique("websiteIdPathKey").on(
      table.websiteId,
      table.path,
    ),
  }),
)

export const contactImports = mysqlTable("contactImports", {
  id,
  fileIdentifier: varchar("fileIdentifier", { length: 64 })
    .unique()
    .notNull(),
  name: varchar("name", { length: 50 }),
  audienceId: primaryKeyCuid("audienceId")
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
      tagIds: string[]
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
    audienceId: primaryKeyCuid("audienceId")
      .references(() => audiences.id)
      .notNull(),
    emailVerificationToken: varchar("emailVerificationToken", {
      length: 100,
    }),
    emailVerificationTokenExpiresAt: timestamp(
      "emailVerificationTokenExpiresAt",
    ),
    contactImportId: primaryKeyCuid("contactImportId").references(
      () => contactImports.id,
    ),
    attributes: json("attributes").$type<Record<string, any>>(),
    createdAt: timestamp("createdAt").defaultNow(),

    // activity window queryes: Active Campaign

    // In the last [days, weeks, months, years], Between [exact dates, today, yesterday, relative dates], Ever
    lastSentBroadcastEmailAt: timestamp("lastSentBroadcastEmailAt"),
    lastSentAutomationEmailAt: timestamp("lastSentAutomationEmailAt"),

    lastOpenedBroadcastEmailAt: timestamp("lastOpenedBroadcastEmailAt"),
    lastClickedBroadcastEmailLinkAt: timestamp(
      "lastClickedBroadcastEmailLinkAt",
    ),

    lastOpenedAutomationEmailAt: timestamp("lastOpenedAutomationEmailAt"),
    lastClickedAutomationEmailLinkAt: timestamp(
      "lastClickedAutomationEmailLinkAt",
    ),

    // Device and location information
    lastTrackedActivityFrom: varchar("lastTrackedActivityFrom", {
      length: 10,
    }),
    lastTrackedActivityUsingDevice: varchar(
      "lastTrackedActivityUsingDevice",
      { length: 56 },
    ),
    lastTrackedActivityUsingBrowser: varchar(
      "lastTrackedActivityUsingBrowser",
      {
        length: 56,
      },
    ),
  },
  (table) => ({
    ContactEmailAudienceIdKey: unique("ContactEmailAudienceIdKey").on(
      table.email,
      table.audienceId,
    ),
  }),
)

// Example usage: Find all contacts where attributes->age > 25.
// select count(*) from contactProperties where name = 'age' and audienceId = 'audienceXXX' and float > 25

export const contactProperties = mysqlTable(
  "contactProperties",
  {
    id,
    name: varchar("name", { length: 256 }).notNull(),
    boolean: boolean("boolean"),
    date: timestamp("date"),
    text: varchar("text", { length: 256 }),
    float: float("float"),
    contactId: primaryKeyCuid("contactId")
      .references(() => contacts.id)
      .notNull(),
    audienceId: primaryKeyCuid("audienceId")
      .references(() => audiences.id)
      .notNull(),
  },
  (table) => ({
    propertyNameContactIdKey: unique("propertyNameContactIdKey").on(
      table.name,
      table.contactId,
    ),
  }),
)

export const tags = mysqlTable(
  "tags",
  {
    id,
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 256 }),
    audienceId: primaryKeyCuid("audienceId")
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
    tagId: primaryKeyCuid("tagId")
      .references(() => tags.id)
      .notNull(),
    contactId: primaryKeyCuid("contactId")
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
  audienceId: primaryKeyCuid("audienceId")
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
})

export const emails = mysqlTable("emails", {
  id,
  type: mysqlEnum("type", ["AUTOMATION", "TRANSACTIONAL"]).notNull(),
  title: varchar("title", { length: 50 }).notNull(),
  audienceId: primaryKeyCuid("audienceId")
    .references(() => audiences.id, { onDelete: "cascade" })
    .notNull(),
  emailContentId: primaryKeyCuid("emailContentId").references(
    () => emailContents.id,
    {
      onDelete: "cascade",
    },
  ),
})

export const abTestVariants = mysqlTable("abTestVariants", {
  id,
  broadcastId: primaryKeyCuid("broadcastId")
    .references(() => broadcasts.id, {
      onDelete: "cascade",
    })
    .notNull(),
  emailContentId: primaryKeyCuid("emailContentId")
    .references(() => emailContents.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  weight: int("weight").default(1).notNull(), // in percentages.
  sendAt: timestamp("sendAt").$type<Date | undefined>(),
})

export const emailSends = mysqlTable("emailSends", {
  id,
  sendingId: varchar("sendingId", { length: 100 }).unique(), // from the mta
  sendingDomainId: primaryKeyCuid("sendingDomainId").references(
    () => sendingDomains.id,
  ),

  // product
  product: mysqlEnum("product", ["engage", "send", "letters"]).notNull(),
  // if the email was sent from engage or letters, then the broadcastId will be set. This will be used for analytics queries like total bounced emails per broadcast.
  broadcastId: primaryKeyCuid("broadcastId").references(
    () => broadcasts.id,
    {
      onDelete: "cascade",
    },
  ),

  sender: varchar("sender", { length: 80 }),
  recipient: varchar("recipient", { length: 80 }),

  contactId: primaryKeyCuid("contactId").references(() => contacts.id),
  audienceId: primaryKeyCuid("audienceId").references(() => audiences.id),

  queue: varchar("queue", { length: 80 }),
  siteName: varchar("siteName", { length: 80 }),
  size: int("size"),
  totalAttempts: int("totalAttempts"),
  createdAt: timestamp("createdAt"),
  sendingSourceId: primaryKeyCuid("sendingSourceId").references(
    () => sendingSources.id,
  ),
  links: json("links").$type<string[]>(),
  nodeId: varchar("nodeId", { length: 48 }),
  egressPool: varchar("egressPool", { length: 80 }),
  egressSource: varchar("egressSource", { length: 80 }),
  deliveryProtocol: varchar("deliveryProtocol", { length: 12 }),
  receptionProtocl: varchar("receptionProtocol", { length: 12 }),

  clickTrackingEnabled: boolean("clickTrackingEnabled").default(false),
  openTrackingEnabled: boolean("openTrackingEnabled").default(false),
})

export const emailSendEvents = mysqlTable("emailSendEvents", {
  id,
  emailSendId: primaryKeyCuid("emailSendId")
    .notNull()
    .references(() => emailSends.id),
  type: mysqlEnum("type", [
    "Delivery",
    "Reception",
    "Bounce",
    "TransientFailure",
    "Expiration",
    "AdminBounce",
    "OOB",
    "Feedback",
    "Rejection",
    "AdminRebind",
    "Any",
    // custom from kibamail engage / send products
    "Click",
    "Open",
  ])
    .notNull()
    .$default(() => "Any"),
  createdAt: timestamp("createdAt"),

  product: mysqlEnum("product", ["engage", "send", "letters"]).notNull(),

  // for engage product, track the contact id.
  contactId: primaryKeyCuid("contactId").references(() => contacts.id),

  // for engage to track events per broadcast and per audience
  broadcastId: primaryKeyCuid("broadcastId").references(
    () => broadcasts.id,
    {
      onDelete: "cascade",
    },
  ),
  audienceId: primaryKeyCuid("audienceId").references(() => audiences.id, {
    onDelete: "cascade",
  }),

  // response code (flat for easier querying)
  responseCode: int("responseCode"),
  responseContent: text("responseContent"),
  responseCommand: varchar("responseCommand", { length: 255 }),
  responseEnhancedCodeClass: int("responseEnhancedCodeClass"),
  responseEnhancedCodeSubject: int("responseEnhancedCodeSubject"),
  responseEnhancedCodeDetail: int("responseEnhancedCodeDetail"),

  // peer address
  peerAddressName: varchar("peerAddressName", { length: 255 }),
  peerAddressAddr: varchar("peerAddressAddr", { length: 255 }),

  // bounces
  bounceClassification: varchar("bounceClassification", { length: 120 }),

  // analytics (mostly for engage)
  originCountry: varchar("originCountry", { length: 10 }),
  originState: varchar("originState", { length: 56 }),
  originCity: varchar("originCity", { length: 56 }),
  originDevice: varchar("originDevice", { length: 56 }),
  originBrowser: varchar("originBrowser", { length: 56 }),
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

  audienceId: primaryKeyCuid("audienceId")
    .references(() => audiences.id)
    .notNull(),
  segmentId: primaryKeyCuid("segmentId").references(() => segments.id),
  teamId: primaryKeyCuid("teamId")
    .references(() => teams.id)
    .notNull(),
  trackClicks: boolean("trackClicks"),
  trackOpens: boolean("trackOpens"),

  emailContentId: primaryKeyCuid("emailContentId").references(
    () => emailContents.id,
    {
      onDelete: "cascade",
    },
  ),
  winningAbTestVariantId: primaryKeyCuid(
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

export const automationStepSubtypesTriggerMap = {
  TRIGGER_CONTACT_SUBSCRIBED: "TRIGGER_CONTACT_SUBSCRIBED",
  TRIGGER_CONTACT_UNSUBSCRIBED: "TRIGGER_CONTACT_UNSUBSCRIBED",
  TRIGGER_CONTACT_TAG_ADDED: "TRIGGER_CONTACT_TAG_ADDED",
  TRIGGER_CONTACT_TAG_REMOVED: "TRIGGER_CONTACT_TAG_REMOVED",
  TRIGGER_API_MANUAL: "TRIGGER_API_MANUAL",
} as const

export const automationStepSubtypesTrigger = [
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_SUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_UNSUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_ADDED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_REMOVED,
  automationStepSubtypesTriggerMap.TRIGGER_API_MANUAL,
  // "TRIGGER_COMMERCE_PRODUCT_PURCHASED",
] as const

export type AUTOMATION_STEP_SUB_TYPES_TRIGGER =
  (typeof automationStepSubtypesTrigger)[number]

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
  tagIds: string[]
}
export type ACTION_REMOVE_TAG_CONFIGURATION = {
  tagIds: string[]
}
export type ACTION_UPDATE_CONTACT_ATTRIBUTES = {
  attributes: Record<string, any>
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

export type END_CONFIGURATION = {
  type: "END"
}

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

export const automationSteps = mysqlTable("automationSteps", {
  id,
  automationId: primaryKeyCuid("automationId")
    .references(() => automations.id)
    .notNull(),
  type: mysqlEnum("type", automationStepTypes).notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
    .notNull()
    .default("DRAFT"),
  subtype: mysqlEnum("subtype", automationStepSubtypes).notNull(),
  parentId: primaryKeyCuid("parentId").references(
    (): AnyMySqlColumn => automationSteps.id,
    {
      onDelete: "cascade",
    },
  ),
  branchIndex: int("branchIndex"),
  configuration: json("configuration")
    .$type<AutomationStepConfiguration>()
    .notNull(),
  emailId: primaryKeyCuid("emailId").references(() => emails.id),
  tagId: primaryKeyCuid("tagId").references(() => tags.id),
  audienceId: primaryKeyCuid("audienceId").references(() => audiences.id),
})

export const segments = mysqlTable("segments", {
  id,
  name: varchar("name", { length: 255 }).notNull(),
  audienceId: primaryKeyCuid("audienceId")
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
    automationStepId: primaryKeyCuid("automationStepId")
      .references(() => automationSteps.id, {
        onDelete: "cascade",
      })
      .notNull(),
    contactId: primaryKeyCuid("contactId")
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

export const contactPurchases = mysqlTable("contactPurchases", {
  id,
  // find all contacts on a specific product (or subscription plan in case of a recurring product)
  productId: primaryKeyCuid("productId")
    .references(() => products.id)
    .notNull(),
  contactId: primaryKeyCuid("contactId")
    .references(() => contacts.id)
    .notNull(),
  purchasedAt: timestamp("purchasedAt"),
  expiresAt: timestamp("expiresAt"), // for subscription type products
  cancelledAt: timestamp("cancelledAt"), // when contact has cancelled subscription
  providerSubscriptionId: varchar("providerSubscriptionId", {
    length: 100,
  }),
})

// Kiba commerce
export const products = mysqlTable("products", {
  id,
  teamId: primaryKeyCuid("teamId")
    .references(() => teams.id)
    .notNull(),
  audienceId: primaryKeyCuid("audienceId").references(() => audiences.id),
  billingCycle: mysqlEnum("cycle", [
    "monthly",
    "yearly",
    "once",
  ]).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  price: int("price"), // for one time payments
  priceYearly: int("priceYearly"), // for subscription payments
  priceMonthly: int("priceMonthly"), // for subscription payments in cents (or kobo, depends on billing provider.)
})

export const productContents = mysqlTable("productContents", {
  id,
  productId: primaryKeyCuid("productId").references(() => products.id),
  type: mysqlEnum("type", ["downloadable", "course"]).notNull(),
})

// Kiba leads
export const forms = mysqlTable("forms", {
  id,
  type: mysqlEnum("type", ["survey", "signup"]),
  appearance: mysqlEnum("appearance", [
    "popover",
    "inline",
    "floating",
    "fullscreen",
  ]).notNull(),
  audienceId: primaryKeyCuid("audienceId")
    .references(() => audiences.id)
    .notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  fields:
    json("fields").$type<
      (CreateFormDto["fields"][number] & { deleted?: boolean })[]
    >(),
  archivedAt: timestamp("archivedAt"),
  // on form submitted:
  // -> redirect to a page
  // -> present with a survey (another form)
  // -> show a thank you message
})

export const formResponses = mysqlTable("formResponses", {
  id,
  formId: primaryKeyCuid("formId")
    .references(() => forms.id)
    .notNull(),
  contactId: primaryKeyCuid("contactId").references(() => contacts.id),
  response: json("response").$type<SubmitFormDto["responses"]>(),
})
