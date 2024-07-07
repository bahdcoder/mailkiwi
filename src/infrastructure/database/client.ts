import { drizzle } from "drizzle-orm/mysql2"
import { migrate } from "drizzle-orm/mysql2/migrator"
import * as schema from "./schema/schema.ts"
import { resolve } from "path"
import mysql from "mysql2/promise"

export const createDatabaseClient = (databaseConnectionUrl: string) =>
  mysql.createConnection(databaseConnectionUrl)

export const runDatabaseMigrations = async (client: DrizzleClient) => {
  await migrate(client, {
    migrationsFolder: resolve(import.meta.dirname, "schema", "migrations"),
  })
}

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>

export const createDrizzleDatabase = (connection: mysql.Connection) =>
  drizzle(connection, { schema: { ...schema }, mode: "default" })
