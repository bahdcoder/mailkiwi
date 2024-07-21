process.env.NODE_ENV = "test"
process.env.DATABASE_URL = "test.db"
process.env.HOST = "0.0.0.0"
process.env.PORT = "5566"
process.env.APP_KEY = "eokwbBbSOHggebeb2PxGK23Bq7EyuCO5"

import { Ignitor } from "@/infrastructure/boot/ignitor.js"
import { makeDatabase } from "@/infrastructure/container.js"
import { settings } from "@/infrastructure/database/schema/schema.js"
import { refreshDatabase } from "./mocks/teams/teams.ts"

const ignitor = new Ignitor()

ignitor.boot()

ignitor.startDatabaseConnector()

const database = makeDatabase()

await refreshDatabase()

const settingsExist = await database.query.settings.findFirst()

if (!settingsExist) {
  await database.insert(settings).values({
    url: "https://marketing.example.com",
    domain: "marketing.example.com",
  })
}

await ignitor.start()
