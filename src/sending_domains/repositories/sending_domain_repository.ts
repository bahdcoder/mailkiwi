import type { Secret } from "@poppinss/utils"

import type { InsertSendingDomain } from "@/database/schema/database_schema_types.ts"
import { sendingDomains } from "@/database/schema/schema.ts"

import { makeDatabase, makeEnv } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

export class SendingDomainRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async create(payload: InsertSendingDomain) {
    const id = this.cuid()

    await this.database.insert(sendingDomains).values({
      id,
      ...payload,
    })

    return { id }
  }
}
