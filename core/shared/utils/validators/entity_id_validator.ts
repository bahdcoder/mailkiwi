import type { AnyMySqlColumn, AnyMySqlTable } from 'drizzle-orm/mysql-core'
import { checkAsync, pipeAsync, string } from 'valibot'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

import { container } from '#root/core/utils/typi.js'

export function entityIdValidator(
  table: AnyMySqlTable & { id: AnyMySqlColumn },
  message?: string,
) {
  return pipeAsync(
    string(),
    checkAsync(async (value) => {
      const exists = await container.make(BaseRepository).crud(table).findById(value)

      return exists !== undefined
    }, message),
  )
}
