import { makeDatabase } from "@/infrastructure/container"

export const cleanMailers = async () => {
  const database = makeDatabase()

  await database.mailer.deleteMany({})
}
