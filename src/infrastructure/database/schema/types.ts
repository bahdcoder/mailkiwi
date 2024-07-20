import { InferSelectModel } from "drizzle-orm"
import { SQLiteUpdateSetSource } from "drizzle-orm/sqlite-core"

import { makeDatabase } from "@/infrastructure/container.js"

import {
  accessTokens,
  mailerIdentities,
  mailers,
  teamMemberships,
  teams,
  users,
} from "./schema.js"

export type User = InferSelectModel<typeof users>
export type AccessToken = InferSelectModel<typeof accessTokens>
export type Mailer = InferSelectModel<typeof mailers>
export type Team = InferSelectModel<typeof teams>
export type TeamMembership = InferSelectModel<typeof teamMemberships>
export type MailerIdentity = InferSelectModel<typeof mailerIdentities>

export type FindMailerByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["mailers"]["findFirst"]
>[0]

export type FindManyMailerIdentityArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["mailerIdentities"]["findMany"]
>[0]

export type FindUserByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["users"]["findFirst"]
>[0]

export type FindAutomationByIdArgs = Parameters<
  ReturnType<typeof makeDatabase>["query"]["automations"]["findFirst"]
>[0]

export type UpdateSetMailerIdentityInput = SQLiteUpdateSetSource<
  typeof mailerIdentities
>

export type UpdateSetMailerInput = SQLiteUpdateSetSource<typeof mailers>
