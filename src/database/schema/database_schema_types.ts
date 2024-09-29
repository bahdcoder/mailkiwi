import type {
  abTestVariants,
  accessTokens,
  audiences,
  automationSteps,
  broadcasts,
  contactImports,
  contacts,
  emailContents,
  emailSendEvents,
  emailSends,
  segments,
  sendingDomains,
  sendingSources,
  tags,
  tagsOnContacts,
  teamMemberships,
  teams,
  users,
} from "./schema.js"
import type { InferSelectModel } from "drizzle-orm"
import type { MySqlUpdateSetSource } from "drizzle-orm/mysql-core"

import type { makeDatabase } from "@/shared/container/index.js"

export type Audience = InferSelectModel<typeof audiences>
export type EmailSend = InferSelectModel<typeof emailSends>
export type Tag = InferSelectModel<typeof tags>
export type Contact = InferSelectModel<typeof contacts>
export type User = InferSelectModel<typeof users>
export type Broadcast = InferSelectModel<typeof broadcasts>
export type BroadcastWithoutContent = Omit<
  Broadcast,
  "contentHtml" | "contentText" | "contentJson"
>
export type AccessToken = InferSelectModel<typeof accessTokens>
export type Team = InferSelectModel<typeof teams>
export type SendingSource = InferSelectModel<typeof sendingSources>
export type TeamMembership = InferSelectModel<typeof teamMemberships>
export type TagOnContact = InferSelectModel<typeof tagsOnContacts>
export type FindUserByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["users"]["findFirst"]
>[0]

export type FindAutomationByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["automations"]["findFirst"]
>[0]

export type UpdateSetContactInput = MySqlUpdateSetSource<typeof contacts>
export type UpdateSetAudienceInput = MySqlUpdateSetSource<typeof audiences>
export type UpdateSetBroadcastInput = Omit<
  MySqlUpdateSetSource<typeof broadcasts>,
  "sendAt"
> & { sendAt: string | undefined }
export type UpdateSetTeamMembershipInput = MySqlUpdateSetSource<
  typeof teamMemberships
>

export type ContactImport = typeof contactImports.$inferSelect
export type AbTestVariant = typeof abTestVariants.$inferSelect
export type Segment = typeof segments.$inferSelect
export type InsertSegment = typeof segments.$inferInsert

export type InsertTag = typeof tags.$inferInsert
export type InsertEmailSend = typeof emailSends.$inferInsert
export type InsertContact = typeof contacts.$inferInsert
export type InsertSendingSource = typeof sendingSources.$inferInsert
export type InsertEmailSendEvent = typeof emailSendEvents.$inferInsert
export type InsertContactImport = typeof contactImports.$inferInsert
export type InsertTeamMembership = typeof teamMemberships.$inferInsert
export type InsertSendingDomain = typeof sendingDomains.$inferInsert
export type InsertAbTestVariant = typeof abTestVariants.$inferInsert

export type UpdateAbTestVariant = MySqlUpdateSetSource<
  typeof abTestVariants
>

export type UpdateEmailSend = MySqlUpdateSetSource<typeof emailSends>
export type UpdateSendingDomain = MySqlUpdateSetSource<
  typeof sendingDomains
>

export type UpdateContactImport = MySqlUpdateSetSource<
  typeof contactImports
>

export type AutomationStep = typeof automationSteps.$inferSelect

export type EmailContent = typeof emailContents.$inferSelect

export type NonNullableProperties<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type ValidatedEmailContent = NonNullableProperties<EmailContent>

export type BroadcastWithEmailContent = Broadcast & {
  emailContent: Required<ValidatedEmailContent>
  abTestVariants: (AbTestVariant & {
    emailContent: Required<ValidatedEmailContent>
  })[]
}

export type BroadcastWithSegment = Broadcast & {
  segment: Segment
}

export type BroadcastWithSegmentAndAbTestVariants =
  BroadcastWithSegment & {
    abTestVariants: AbTestVariant[]
    audience: Audience
    team: Team
  }

export type UserWithTeams = User & { teams: Team }
export type ContactWithTags = Contact & {
  tags: (TagOnContact & {
    tag: Tag
  })[]
}
