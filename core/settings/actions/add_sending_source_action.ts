import { SendingSourceRepository } from '#root/core/settings/repositories/sending_source_repository.js'

import type { InsertSendingSource } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class AddSendingSourceAction {
  async handle(payload: InsertSendingSource) {
    const { id } = await container.make(SendingSourceRepository).create(payload)

    return id
  }
}
