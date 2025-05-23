import { type AnyColumn, type InferSelectModel, eq, getTableName } from 'drizzle-orm'
import type { AnyMySqlTable, MySqlSelect } from 'drizzle-orm/mysql-core'

import type { DrizzleClient } from '#root/database/client.js'

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

/**
 * Implements a one-to-many relationship between database tables.
 *
 * This utility function creates a one-to-many relationship between two tables,
 * allowing efficient loading of related records in a single query. It's used throughout
 * Kibamail to implement relationships like:
 *
 * - User to Teams (one user can own multiple teams)
 * - Team to Audiences (one team can have multiple audiences)
 * - Audience to Contacts (one audience can have multiple contacts)
 * - Broadcast to EmailSends (one broadcast can have multiple email sends)
 *
 * The function performs a LEFT JOIN between the tables and groups the results,
 * transforming the flat result set into a nested object structure that matches
 * the logical relationship between the entities.
 *
 * @param db - The database client
 * @param config - Configuration defining the relationship between tables
 * @returns A function that executes the query with optional customization
 */
export function hasMany<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: RelationshipConfig<T, R, RName>) {
  return async (
    $modifyQuery?: (
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
      query: MySqlSelect<T['_']['name'], Record<string, any>>,
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
    ) => MySqlSelect<T['_']['name'], Record<string, any>>,
    // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
    $modifyRelationshipResults?: (row: any, results: any) => any,
  ): Promise<
    (T['$inferSelect'] & {
      [K in RName]: R['$inferSelect'][]
    })[]
  > => {
    const { from, to, foreignKey, primaryKey, relationName } = config

    const fromTableName = getTableName(from)
    const toTableName = getTableName(to)

    let query = db.select().from(from).leftJoin(to, eq(foreignKey, primaryKey)).$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    const groupedResults: {
      [key: string]: T['$inferSelect'] & {
        [key: string]: R['$inferSelect'][]
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

/**
 * Implements a one-to-one relationship between database tables.
 *
 * This utility function creates a one-to-one relationship between two tables,
 * allowing efficient loading of a single related record in a single query. It's used
 * for relationships where each record in the first table has at most one related
 * record in the second table, such as:
 *
 * - User to Profile (one user has one profile)
 * - Team to Settings (one team has one settings record)
 * - Contact to Subscription (one contact has one subscription status)
 *
 * The function performs a LEFT JOIN between the tables and transforms the result
 * into a nested object structure, with the related record as a property of the
 * parent record. If no related record exists, the property will be null.
 *
 * @param db - The database client
 * @param config - Configuration defining the relationship between tables
 * @returns A function that executes the query with optional customization
 */
export function hasOne<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: RelationshipConfig<T, R, RName>) {
  const fromTableName = getTableName(config.from)
  const toTableName = getTableName(config.to)
  return async (
    $modifyQuery?: (
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
      query: MySqlSelect<T['_']['name'], Record<string, any>>,
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
    ) => MySqlSelect<T['_']['name'], Record<string, any>>,
  ): Promise<(T['$inferSelect'] & { [K in RName]: R['$inferSelect'] | null })[]> => {
    const { from, to, foreignKey, primaryKey, relationName } = config
    let query = db.select().from(from).leftJoin(to, eq(foreignKey, primaryKey)).$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    return results.map((row) => ({
      ...row[fromTableName],
      [relationName]: row[toTableName] || null,
    })) as unknown as Promise<
      (T['$inferSelect'] & { [K in RName]: R['$inferSelect'] | null })[]
    >
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

/**
 * Implements a many-to-one relationship between database tables.
 *
 * This utility function creates a many-to-one relationship between two tables,
 * allowing efficient loading of a parent record for each child record in a single query.
 * It's used for relationships where many records in the first table are associated with
 * a single record in the second table, such as:
 *
 * - Contact to Audience (many contacts belong to one audience)
 * - EmailSend to Broadcast (many email sends belong to one broadcast)
 * - TeamMembership to Team (many team memberships belong to one team)
 *
 * The function performs a LEFT JOIN between the tables and transforms the result
 * into a nested object structure, with the parent record as a property of each
 * child record. If no parent record exists, the property will be null.
 *
 * @param db - The database client
 * @param config - Configuration defining the relationship between tables
 * @returns A function that executes the query with optional customization
 */
export function belongsTo<
  T extends AnyMySqlTable,
  R extends AnyMySqlTable,
  RName extends string,
>(db: DrizzleClient, config: BelongsToConfig<T, R, RName>) {
  const fromTableName = getTableName(config.from)
  const toTableName = getTableName(config.to)
  return async (
    $modifyQuery?: (
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
      query: MySqlSelect<T['_']['name'], Record<string, any>>,
      // biome-ignore lint/suspicious/noExplicitAny: Using any here to match the MySQL driver types
    ) => MySqlSelect<T['_']['name'], Record<string, any>>,
  ): Promise<(InferSelectModel<T> & { [K in RName]: InferSelectModel<R> | null })[]> => {
    const { from, to, foreignKey, primaryKey, relationName } = config
    let query = db.select().from(from).leftJoin(to, eq(foreignKey, primaryKey)).$dynamic()

    if ($modifyQuery) {
      query = $modifyQuery(query) as typeof query
    }

    const results = await query

    return results.map((row) => ({
      ...row[fromTableName],
      [relationName]: row[toTableName] || null,
    })) as unknown as (InferSelectModel<T> & {
      [K in RName]: InferSelectModel<R> | null
    })[]
  }
}
