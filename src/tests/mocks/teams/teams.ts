import { makeDatabase } from "@/infrastructure/container.js"
import { mailers, users } from "@/infrastructure/database/schema/schema.ts"

export const cleanMailers = async () => {
  const database = makeDatabase()

  await database.delete(mailers)
  await database.delete(users)
}
