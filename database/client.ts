import type { drizzle } from 'drizzle-orm/mysql2'
import * as dbSchema from './schema.js'

export const schema = dbSchema

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>
