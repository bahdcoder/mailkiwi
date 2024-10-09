import { InsertEmailSendEvent } from "@/database/schema/database_schema_types.js"
import { emailSendEvents } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

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
