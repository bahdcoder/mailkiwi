import { makeDatabase } from "@/infrastructure/container.js"
import {
  accessTokens,
  audiences,
  contacts,
  mailerIdentities,
  mailers,
  teams,
  users,
} from "@/infrastructure/database/schema/schema.ts"

export const cleanMailers = async () => {
  const database = makeDatabase()

  await database.delete(mailerIdentities)
  await database.delete(mailers)
  await database.delete(contacts)
  await database.delete(audiences)
  await database.delete(teams)
  await database.delete(accessTokens)
  await database.delete(users)
}
