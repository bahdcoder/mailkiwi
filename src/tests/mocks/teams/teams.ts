import { sql } from "drizzle-orm"

import { makeDatabase } from "@/infrastructure/container.js"
import {
  accessTokens,
  audiences,
  automations,
  automationSteps,
  contacts,
  mailerIdentities,
  mailers,
  teams,
  users,
} from "@/infrastructure/database/schema/schema.ts"

export const refreshDatabase = async () => {
  const database = makeDatabase()

  await database.execute(sql`SET FOREIGN_KEY_CHECKS=0;`)

  await database.delete(mailerIdentities)
  await database.delete(mailers)
  await database.delete(contacts)
  await database.delete(automationSteps)
  await database.delete(automations)
  await database.delete(audiences)
  await database.delete(accessTokens)
  await database.delete(teams)
  await database.delete(users)

  await database.execute(sql`SET FOREIGN_KEY_CHECKS=1;`)
}
