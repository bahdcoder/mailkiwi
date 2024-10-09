import { aliasedTableColumn, and, count, eq, sql } from "drizzle-orm"

import {
  InsertSendingSource,
  SendingSource,
} from "@/database/schema/database_schema_types.js"
import { emailSends, sendingSources } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class SendingSourceRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async findByIpv4Address(ipv4: string) {
    const [sendingSource] = await this.database
      .select()
      .from(sendingSources)
      .where(eq(sendingSources.address, ipv4))
      .limit(1)

    return sendingSource
  }

  async create(payload: InsertSendingSource) {
    const id = this.cuid()
    await this.database.insert(sendingSources).values({ ...payload, id })

    return { id }
  }

  async findAllSendingSourcseWithSendingVolume() {
    const sendingSourcesWithVolume = await this.database
      .select({
        id: sendingSources.id,
        emailSendsCount: count(emailSends.id),
        address: sendingSources.address,
        addressIpv6: sendingSources.addressIpv6,
        pool: sendingSources.pool,
      })
      .from(sendingSources)
      .leftJoin(
        emailSends,
        eq(emailSends.sendingSourceId, sendingSources.id),
      )
      .where(eq(sendingSources.status, "active"))
      .groupBy(sendingSources.id)

    return sendingSourcesWithVolume
  }
}
