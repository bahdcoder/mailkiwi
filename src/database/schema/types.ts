import type { InferSelectModel } from 'drizzle-orm'
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core'

import type { makeDatabase } from '@/shared/container/index.js'

import type {
  accessTokens,
  audiences,
  broadcasts,
  contacts,
  mailerIdentities,
  mailers,
  settings,
  teamMemberships,
  teams,
  users,
  segments,
  emailContents,
  automationSteps,
  abTestVariants,
} from './schema.js'

export type Setting = InferSelectModel<typeof settings>
export type Audience = InferSelectModel<typeof audiences>
export type Contact = InferSelectModel<typeof contacts>
export type User = InferSelectModel<typeof users>
export type Broadcast = InferSelectModel<typeof broadcasts>
export type BroadcastWithoutContent = Omit<
  Broadcast,
  'contentHtml' | 'contentText' | 'contentJson'
>
export type AccessToken = InferSelectModel<typeof accessTokens>
export type Mailer = InferSelectModel<typeof mailers>
export type Team = InferSelectModel<typeof teams>
export type TeamMembership = InferSelectModel<typeof teamMemberships>
export type MailerIdentity = InferSelectModel<typeof mailerIdentities>

export type FindMailerByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['mailers']['findFirst']
>[0]

export type FindManyMailerIdentityArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['mailerIdentities']['findMany']
>[0]

export type FindUserByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['users']['findFirst']
>[0]

export type FindAutomationByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>['query']['automations']['findFirst']
>[0]

export type UpdateSetMailerIdentityInput = SQLiteUpdateSetSource<
  typeof mailerIdentities
>

export type UpdateSetMailerInput = SQLiteUpdateSetSource<typeof mailers>
export type UpdateSetContactInput = SQLiteUpdateSetSource<typeof contacts>
export type UpdateSetBroadcastInput = Omit<
  SQLiteUpdateSetSource<typeof broadcasts>,
  'sendAt'
> & { sendAt: string | undefined }

export type AbTestVariant = typeof abTestVariants.$inferSelect
export type Segment = typeof segments.$inferSelect
export type InsertSegment = typeof segments.$inferInsert

export type InsertAbTestVariant = typeof abTestVariants.$inferInsert
export type UpdateAbTestVariant = SQLiteUpdateSetSource<typeof abTestVariants>

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

export type BroadcastWithSegmentAndAbTestVariants = BroadcastWithSegment & {
  abTestVariants: AbTestVariant[]
  audience: Audience
  team: Team
}
