import { SendingSourceRepository } from "@/settings/repositories/sending_source_repository.js"

import { InsertSendingSource } from "@/database/schema/database_schema_types.js"

import { container } from "@/utils/typi.js"

export class AddSendingSourceAction {
  async handle(payload: InsertSendingSource) {
    const { id } = await container
      .make(SendingSourceRepository)
      .create(payload)

    return id
  }
}
