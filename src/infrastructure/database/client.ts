import SqliteDatabase, { Database } from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "./schema/schema.js"

export const createDatabaseClient = (databaseConnectionUrl: string): Database =>
  new SqliteDatabase(databaseConnectionUrl)

// export const runDatabaseMigrations = async (client: DrizzleClient) => {
//   await migrate(client, {
//     migrationsFolder: resolve(
//       import.meta.dirname ?? __dirname,
//       "schema",
//       "migrations",
//     ),
//   })
// }

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>

export const createDrizzleDatabase = (connection: Database) =>
  drizzle(connection, { schema: { ...schema } })
