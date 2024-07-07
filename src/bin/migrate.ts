import { migrate } from "drizzle-orm/mysql2/migrator"
import { resolve } from "path"

import {
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/infrastructure/database/client.js"
import { env } from "@/infrastructure/env.js"

const connection = await createDatabaseClient(env.DATABASE_URL)

const database = createDrizzleDatabase(connection)

await migrate(database, {
  migrationsFolder: resolve(
    process.cwd(),
    "src",
    "infrastructure",
    "database",
    "schema",
    "migrations",
  ),
})

await connection.end()
