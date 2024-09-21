import { eq } from "drizzle-orm"

import type { InsertSendingDomain } from "@/database/schema/database_schema_types.js"
import { sendingDomains } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

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

  async findById(sendingDomainId: string) {
    const [sendingDomain] = await this.database
      .select()
      .from(sendingDomains)
      .where(eq(sendingDomains.id, sendingDomainId))

    return sendingDomain
  }
}
