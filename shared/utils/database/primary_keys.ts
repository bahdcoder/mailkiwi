import type { MySqlRawQueryResult } from 'drizzle-orm/mysql2'

export function fromQueryResultToPrimaryKey(result: MySqlRawQueryResult) {
  return result?.[0]?.insertId
}
