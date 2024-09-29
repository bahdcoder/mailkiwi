import { MySqlRawQueryResult } from "drizzle-orm/mysql2"

import type { DrizzleClient } from "@/database/client.js"

import { Cache } from "@/shared/cache/cache.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

type ObjectWithNullable<T> = { [K in keyof T]: T[K] | null | undefined }

export class BaseRepository {
  protected database: DrizzleClient

  protected cache = container.make(Cache)

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

  removeNullUndefined<T extends Record<string, unknown>>(
    obj: ObjectWithNullable<T>,
  ) {
    return Object.fromEntries(
      Object.entries(obj).filter((entry) => {
        const [_, value] = entry
        return value !== null && value !== undefined
      }),
    ) as T
  }
}
