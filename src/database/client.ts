import * as schema from "./schema/schema.js"
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

export const createDatabaseClient = (databaseConnectionUrl: string) =>
  mysql.createConnection(databaseConnectionUrl)

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>

export const createDrizzleDatabase = (connection: mysql.Connection) =>
  drizzle(connection, { schema, mode: "default" })
