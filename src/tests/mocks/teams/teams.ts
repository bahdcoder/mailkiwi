import { makeDatabase } from "@/infrastructure/container.js"

export const cleanMailers = async () => {
  const database = makeDatabase()

  await database.mailer.deleteMany({})
}
