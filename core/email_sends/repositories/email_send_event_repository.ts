import type { InsertEmailSendEvent } from '#root/database/database_schema_types.js'
import { emailSendEvents } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class EmailSendEventRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async create(payload: InsertEmailSendEvent) {
    const id = this.cuid()
    await this.database.insert(emailSendEvents).values({ id, ...payload })

    return { id }
  }
}
