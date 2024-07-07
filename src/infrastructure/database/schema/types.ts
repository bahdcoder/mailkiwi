import { InferSelectModel } from "drizzle-orm"
import { MySqlUpdateSetSource } from "drizzle-orm/mysql-core"

import { makeDatabase } from "@/infrastructure/container.ts"

import { mailerIdentities, mailers, teams, users } from "./schema.ts"

export type User = InferSelectModel<typeof users>
export type Mailer = InferSelectModel<typeof mailers>
export type Team = InferSelectModel<typeof teams>
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

export type UpdateSetMailerIdentityInput = MySqlUpdateSetSource<
  typeof mailerIdentities
>

export type UpdateSetMailerInput = MySqlUpdateSetSource<typeof mailers>
