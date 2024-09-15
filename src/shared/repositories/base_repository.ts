import { AnyTable, InferSelectModel } from "drizzle-orm"
import { MySqlRawQueryResult } from "drizzle-orm/mysql2"
import { AnyMySqlTable } from "drizzle-orm/mysql-core"

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

  cuid() {
    return cuid()
  }

  protected hasMany<
    T extends AnyMySqlTable,
    R extends AnyMySqlTable,
    TSelect extends InferSelectModel<T>,
    RSelect extends InferSelectModel<R>,
  >(
    results: (TSelect & { [K in keyof RSelect]?: RSelect[K] | null })[],
    parentTable: keyof (TSelect & RSelect),
    childTable: keyof (TSelect & RSelect),
    childArrayName: string,
  ): (TSelect & { [key: string]: RSelect[] })[] {
    const groupedResults: {
      [key: string]: TSelect & { [key: string]: RSelect[] }
    } = {}

    for (const row of results) {
      const parentKey = JSON.stringify(row[parentTable])
      if (!groupedResults[parentKey]) {
        groupedResults[parentKey] = {
          ...(row[parentTable] as TSelect),
          [childArrayName]: [],
        }
      }
      if (row[childTable]) {
        groupedResults[parentKey][childArrayName].push(
          row[childTable] as RSelect,
        )
      }
    }

    return Object.values(groupedResults)
  }
}
