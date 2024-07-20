import { Ignitor } from "@/infrastructure/boot/ignitor.js"
import { makeDatabase } from "@/infrastructure/container.ts"
import { settings } from "@/infrastructure/database/schema/schema.ts"

import { refreshDatabase } from "./mocks/teams/teams.ts"

process.env.NODE_ENV = "test"

const ignitor = new Ignitor()

ignitor.boot()

await ignitor.startDatabaseConnector()

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
