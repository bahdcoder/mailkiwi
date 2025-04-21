import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema.js'

export const createDatabaseClient = (databaseConnectionUrl: string) =>
  mysql.createConnection({
    uri: databaseConnectionUrl,
  })

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>

export const createDrizzleDatabase = (connection: mysql.Connection) =>
  drizzle(connection, { schema, mode: 'default', logger: false })
