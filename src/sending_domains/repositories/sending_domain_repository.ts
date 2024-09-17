import { eq } from "drizzle-orm"

import type { InsertSendingDomain } from "@/database/schema/database_schema_types.ts"
import { sendingDomains } from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class SendingDomainRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async create(payload: InsertSendingDomain) {
    const insertResult = await this.database
      .insert(sendingDomains)
      .values({
        ...payload,
      })

    return { id: this.primaryKey(insertResult) }
  }

  async findById(sendingDomainId: number) {
    const [sendingDomain] = await this.database
      .select()
      .from(sendingDomains)
      .where(eq(sendingDomains.id, sendingDomainId))

    return sendingDomain
  }
}
