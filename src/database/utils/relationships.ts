import {
  AnyColumn,
  InferModel,
  InferSelectModel,
  SQL,
  eq,
  getTableName,
} from "drizzle-orm"
import {
  AnyMySqlTable,
  MySqlSelect,
  MySqlSelectBase,
} from "drizzle-orm/mysql-core"

import type { DrizzleClient } from "@/database/client.js"

type RelationshipConfig<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
> = {
  from: T
  to: R
  foreignKey: AnyColumn
  primaryKey: AnyColumn
  relationName: RName
}

export function hasMany<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: RelationshipConfig<T, R, RName>) {
  return async (
    $modifyQuery?: (
      query: MySqlSelect<T["_"]["name"], Record<string, any>>,
    ) => MySqlSelect<T["_"]["name"], Record<string, any>>,
    $modifyRelationshipResults?: (row: any, results: any) => any,
  ): Promise<
    (T["$inferSelect"] & {
      [K in RName]: R["$inferSelect"][]
    })[]
  > => {
    const { from, to, foreignKey, primaryKey, relationName } = config

    const fromTableName = getTableName(from)
    const toTableName = getTableName(to)

    let query = db
      .select()
      .from(from)
      .leftJoin(to, eq(foreignKey, primaryKey))
      .$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    const groupedResults: {
      [key: string]: T["$inferSelect"] & {
        [key: string]: R["$inferSelect"][]
      }
    } = {}

    for (const row of results) {
      const parentKey = JSON.stringify(row[fromTableName])
      if (!groupedResults[parentKey]) {
        groupedResults[parentKey] = {
          ...row[fromTableName],
          [relationName]: [],
        }
      }
      if (row[toTableName]) {
        groupedResults[parentKey][relationName].push(
          $modifyRelationshipResults
            ? $modifyRelationshipResults?.(row, results)
            : row[toTableName],
        )
      }
    }

    return Object.values(groupedResults)
  }
}

export function hasOne<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: RelationshipConfig<T, R, RName>) {
  const fromTableName = getTableName(config.from)
  const toTableName = getTableName(config.to)
  return async (
    $modifyQuery?: (
      query: MySqlSelect<T["_"]["name"], Record<string, any>>,
    ) => MySqlSelect<T["_"]["name"], Record<string, any>>,
  ): Promise<
    (T["$inferSelect"] & { [K in RName]: R["$inferSelect"] | null })[]
  > => {
    const { from, to, foreignKey, primaryKey, relationName } = config
    let query = db
      .select()
      .from(from)
      .leftJoin(to, eq(foreignKey, primaryKey))
      .$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    return results.map((row) => ({
      ...row[fromTableName],
      [relationName]: row[toTableName] || null,
    }))
  }
}

type BelongsToConfig<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
> = {
  from: T
  to: R
  foreignKey: AnyColumn
  primaryKey: AnyColumn
  relationName: RName
}

export function belongsTo<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: BelongsToConfig<T, R, RName>) {
  const fromTableName = getTableName(config.from)
  const toTableName = getTableName(config.to)
  return async (
    $modifyQuery?: (
      query: MySqlSelect<T["_"]["name"], Record<string, any>>,
    ) => MySqlSelect<T["_"]["name"], Record<string, any>>,
  ): Promise<
    (InferSelectModel<T> & { [K in RName]: InferSelectModel<R> | null })[]
  > => {
    const { from, to, foreignKey, primaryKey, relationName } = config
    let query = db
      .select()
      .from(from)
      .leftJoin(to, eq(foreignKey, primaryKey))
      .$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    return results.map((row) => ({
      ...row[fromTableName],
      [relationName]: row[toTableName] || null,
    }))
  }
}
