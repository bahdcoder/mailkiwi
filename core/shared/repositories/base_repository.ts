import { appEnv } from '#root/core/app/env/app_env.js'
import { type SQLWrapper, and, eq } from 'drizzle-orm'
import type {
  AnyMySqlColumn,
  AnyMySqlTable,
  MySqlUpdateSetSource,
} from 'drizzle-orm/mysql-core'
import type { MySqlRawQueryResult } from 'drizzle-orm/mysql2'

import type { DrizzleClient } from '#root/database/client.js'

import { Cache } from '#root/core/shared/cache/cache.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

import { container } from '#root/core/utils/typi.js'

type ObjectWithNullable<T> = { [K in keyof T]: T[K] | null | undefined }

export class BaseRepository {
  protected database: DrizzleClient
  protected isATransactionRepository = false

  protected cache = container.make(Cache)

  transaction(transaction: DrizzleClient) {
    this.database = transaction
    this.isATransactionRepository = true

    return this
  }

  encrypt(value: string) {
    return new Encryption(appEnv.APP_KEY).encrypt(value)
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

  removeNullUndefined<T extends Record<string, unknown>>(obj: ObjectWithNullable<T>) {
    return Object.fromEntries(
      Object.entries(obj).filter((entry) => {
        const [_, value] = entry
        return value !== null && value !== undefined
      }),
    ) as T
  }

  crud<Table extends AnyMySqlTable & { id: AnyMySqlColumn }>(table: Table) {
    const database = makeDatabase()

    const self = this

    return {
      async create(payload: Table['$inferInsert'] & { id?: string }) {
        const id = payload.id || self.cuid()

        await database.insert(table).values({ id, ...payload })

        return { id }
      },
      async findOne(conditions?: SQLWrapper) {
        const [row] = await database.select().from(table).where(and(conditions)).limit(1)

        return row
      },
      async findAll(conditions?: SQLWrapper) {
        return database.select().from(table).where(and(conditions))
      },
      async bulkCreate(payload: Table['$inferInsert'][]) {
        const values = payload.map((value) => ({
          id: self.cuid(),
          ...value,
        }))

        await database.insert(table).values(values)

        return { id: values.map((value) => value.id) }
      },
      async update(
        id: string,
        payload: MySqlUpdateSetSource<Table>,
        conditions: SQLWrapper[] = [],
      ) {
        await database
          .update(table)
          .set(payload)
          .where(and(eq(table.id, id), ...conditions))
      },
      async delete(id: string, conditions: SQLWrapper[] = []) {
        await database.delete(table).where(and(eq(table.id, id), ...conditions))
      },
      async deleteAll(conditions?: SQLWrapper) {
        await database.delete(table).where(and(conditions))
      },
      async findById(id: string) {
        const [row] = await database.select().from(table).where(eq(table.id, id)).limit(1)

        return row
      },
    }
  }
}
