import { MySqlRawQueryResult } from "drizzle-orm/mysql2"

import type { DrizzleClient } from "@/database/client.js"

import { cuid } from "@/shared/utils/cuid/cuid.js"

export class BaseRepository {
  protected database: DrizzleClient

  transaction(transaction: DrizzleClient) {
    this.database = transaction

    return this
  }

  primaryKey(result: MySqlRawQueryResult) {
    return result?.[0]?.insertId as number
  }

  rand() {
    return Math.random()
  }

  cuid() {
    return cuid()
  }
}
