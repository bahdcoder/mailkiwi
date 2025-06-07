import type { InferSelectModel } from 'drizzle-orm'
import type { MySqlUpdateSetSource } from 'drizzle-orm/mysql-core'
import type {
  abTestVariants,
  accessTokens,
  audiences,
  automationSteps,
  automations,
  broadcastGroups,
  broadcasts,
  channelMemberships,
  channels,
  contactImports,
  contactProperties,
  contacts,
  emailContents,
  emailSendEvents,
  emailSends,
  emails,
  formResponses,
  forms,
  mediaDocuments,
  messageReactions,
  messages,
  oauth2Accounts,
  passwordResets,
  products,
  segments,
  senderIdentities,
  sendingDomains,
  sendingSources,
  settings,
  tags,
  tagsOnContacts,
  teamMemberships,
  teams,
  users,
  websitePages,
  websites,
} from './schema.js'

import type { makeDatabase } from '#root/core/shared/container/index.js'

export type Audience = InferSelectModel<typeof audiences>
export type Website = InferSelectModel<typeof websites>
export type WebsitePage = InferSelectModel<typeof websitePages>
export type EmailSend = InferSelectModel<typeof emailSends>
type Email = InferSelectModel<typeof emails>
export type Tag = InferSelectModel<typeof tags>
export type Contact = InferSelectModel<typeof contacts>
export type User = InferSelectModel<typeof users>
export type ContactProperty = InferSelectModel<typeof contactProperties>
export type Broadcast = InferSelectModel<typeof broadcasts>
export type BroadcastGroup = InferSelectModel<typeof broadcastGroups>

// Chat
export type Message = InferSelectModel<typeof messages>
export type Channel = InferSelectModel<typeof channels>
type ChannelMembership = InferSelectModel<typeof channelMemberships>
type MessageReaction = InferSelectModel<typeof messageReactions>

export type BroadcastWithoutContent = Omit<
  Broadcast,
  'contentHtml' | 'contentText' | 'contentJson'
>
type AccessToken = InferSelectModel<typeof accessTokens>
export type Team = InferSelectModel<typeof teams>
export type SendingDomain = InferSelectModel<typeof sendingDomains>
export type SendingSource = InferSelectModel<typeof sendingSources>
export type SenderIdentity = InferSelectModel<typeof senderIdentities>
export type TeamMembership = InferSelectModel<typeof teamMemberships>
type Oauth2Account = InferSelectModel<typeof oauth2Accounts>
export type TagOnContact = InferSelectModel<typeof tagsOnContacts>
type FindUserByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['users']['findFirst']
>[0]

export type SenderIdentityWithSendingDomain = SenderIdentity & {
  sendingDomain: SendingDomain
}

type FindAutomationByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['automations']['findFirst']
>[0]

export type UpdateSetContactInput = MySqlUpdateSetSource<typeof contacts>
export type UpdateSetAudienceInput = MySqlUpdateSetSource<typeof audiences>
export type UpdateSetBroadcastInput = Omit<
  MySqlUpdateSetSource<typeof broadcasts>,
  'sendAt'
> & {
  sendAt: string | undefined
}
export type UpdateSetTeamMembershipInput = MySqlUpdateSetSource<typeof teamMemberships>
type UpdateMediaDocument = MySqlUpdateSetSource<typeof mediaDocuments>

export type MediaDocument = typeof mediaDocuments.$inferSelect
export type ContactImport = typeof contactImports.$inferSelect
export type AbTestVariant = typeof abTestVariants.$inferSelect
export type EmailSendEvent = typeof emailSendEvents.$inferSelect
export type Segment = typeof segments.$inferSelect
export type Product = typeof products.$inferSelect
export type Form = typeof forms.$inferSelect
export type FormResponse = typeof formResponses.$inferSelect
type PasswordReset = typeof passwordResets.$inferSelect
export type InsertSegment = typeof segments.$inferInsert
export type InsertTag = typeof tags.$inferInsert
export type InsertEmailSend = typeof emailSends.$inferInsert
export type InsertContact = typeof contacts.$inferInsert
export type InsertSetting = typeof settings.$inferInsert
export type InsertSendingSource = typeof sendingSources.$inferInsert
export type InsertEmailSendEvent = typeof emailSendEvents.$inferInsert
export type InsertContactImport = typeof contactImports.$inferInsert
export type InsertTeamMembership = typeof teamMemberships.$inferInsert
export type InsertSendingDomain = typeof sendingDomains.$inferInsert
export type InsertSenderIdentity = typeof senderIdentities.$inferInsert
export type InsertAbTestVariant = typeof abTestVariants.$inferInsert
export type InsertProduct = typeof products.$inferInsert
export type InsertWebsite = typeof websites.$inferInsert
export type InsertForm = typeof forms.$inferInsert
type InsertBroadcastGroup = typeof broadcastGroups.$inferInsert

// Chat
export type InsertUser = typeof users.$inferInsert
export type InsertMessage = typeof messages.$inferInsert
type InsertMessageReaction = typeof messageReactions.$inferInsert
export type InsertChannel = typeof channels.$inferInsert
type InsertChannelMembership = typeof channelMemberships.$inferInsert

type InsertPasswordReset = typeof passwordResets.$inferInsert

type UpdateAbTestVariant = MySqlUpdateSetSource<typeof abTestVariants>

export type UpdateWebsite = MySqlUpdateSetSource<typeof websites>

export type UpdateWebsitePage = MySqlUpdateSetSource<typeof websitePages>

type UpdateForm = MySqlUpdateSetSource<typeof forms>

type UpdatePasswordReset = MySqlUpdateSetSource<typeof passwordResets>

export type UpdateEmailSend = MySqlUpdateSetSource<typeof emailSends>
export type UpdateSendingDomain = MySqlUpdateSetSource<typeof sendingDomains>
export type UpdateSenderIdentity = MySqlUpdateSetSource<typeof senderIdentities>

export type UpdateUser = MySqlUpdateSetSource<typeof users>
export type UpdateContactImport = MySqlUpdateSetSource<typeof contactImports>

export type UpdateMessage = MySqlUpdateSetSource<typeof messages>
export type UpdateChannel = MySqlUpdateSetSource<typeof channels>
type UpdateChannelMembership = MySqlUpdateSetSource<typeof channelMemberships>
type UpdateMessageReaction = MySqlUpdateSetSource<typeof messageReactions>

export type AutomationStep = typeof automationSteps.$inferSelect

export type EmailContent = typeof emailContents.$inferSelect

export type AutomationWithSteps = typeof automations.$inferSelect & {
  steps: AutomationStep[]
}
type NonNullableProperties<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type ValidatedEmailContent = NonNullableProperties<EmailContent>

type EmailWithContent = Email & {
  emailContent: EmailContent | null
}

export type BroadcastWithEmailContent = Broadcast & {
  emailContent: Required<ValidatedEmailContent>
  abTestVariants: (AbTestVariant & {
    emailContent: Required<ValidatedEmailContent>
  })[]
}

type BroadcastWithSegment = Broadcast & {
  segment: Segment
}

export type BroadcastWithSegmentAndAbTestVariants = BroadcastWithSegment & {
  abTestVariants: AbTestVariant[]
  audience: Audience
  team: Team
}

export type UserWithTeams = User & { teams: Team[] }
type UserWithChannelMemberships = User & {
  channels: ChannelMembership[]
}
export type ContactWithTags = Contact & {
  tags: (TagOnContact & {
    tag: Tag
  })[]
}

export type ContactWithTagsAndProperties = ContactWithProperties & {
  tags: Tag[]
}

export type TeamWithSendingDomains = Team & {
  sendingDomains: SendingDomain[]
}

export type TeamWithSenderIdentities = Team & {
  senderIdentities: SenderIdentity[]
}

export type TeamWithMemberships = Team & {
  members: TeamMembership[]
}

export type ContactWithProperties = Contact & {
  properties: ContactProperty[]
  parsedProperties: Record<string, string | string[] | number | boolean | Date | null>
}

export type WebsiteWithPages = Website & {
  pages: WebsitePage[]
}

export type BroadcastGroupWithBroadcasts = BroadcastGroup & {
  broadcasts: Broadcast[]
}

type SendingDomainWithSenderIdentities = SendingDomain & {
  senderIdentities: SenderIdentity[]
}
