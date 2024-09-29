import { aliasedTable, eq } from "drizzle-orm"

import type {
  InsertSendingDomain,
  SendingSource,
  UpdateSendingDomain,
} from "@/database/schema/database_schema_types.js"
import {
  sendingDomains,
  sendingSources,
} from "@/database/schema/schema.js"
import { belongsTo } from "@/database/utils/relationships.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class SendingDomainRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  protected belongsToSendingSource = belongsTo(this.database, {
    from: sendingDomains,
    to: sendingSources,
    primaryKey: sendingSources.id,
    foreignKey: sendingDomains.sendingSourceId,
    relationName: "sendingSource",
  })

  async create(payload: InsertSendingDomain) {
    const id = this.cuid()

    await this.database.insert(sendingDomains).values({
      id,
      ...payload,
    })

    return { id }
  }

  async update(sendingDomainId: string, payload: UpdateSendingDomain) {
    await this.database
      .update(sendingDomains)
      .set(payload)
      .where(eq(sendingDomains.id, sendingDomainId))
  }

  async findById(sendingDomainId: string) {
    const [sendingDomain] = await this.database
      .select()
      .from(sendingDomains)
      .where(eq(sendingDomains.id, sendingDomainId))
      .limit(1)

    return sendingDomain
  }

  async getDomainWithDkim(domain: string, refreshCache?: boolean) {
    const self = this

    const cache = self.cache.namespace("domains")

    if (refreshCache) {
      await cache.clear(domain)
    }

    await cache.clear(domain)

    const primarySendingSource = aliasedTable(
      sendingSources,
      "primarySendingSource",
    )

    const secondarySendingSource = aliasedTable(
      sendingSources,
      "secondarySendingSource",
    )

    const primaryEngageSendingSource = aliasedTable(
      sendingSources,
      "primaryEngageSendingSource",
    )

    const secondaryEngageSendingSource = aliasedTable(
      sendingSources,
      "secondaryEngageSendingSource",
    )

    // get the primary and secondary domains
    const [sendingSource] = await self.database
      .select()
      .from(sendingDomains)
      .leftJoin(
        primarySendingSource,
        eq(primarySendingSource.id, sendingDomains.sendingSourceId),
      )
      .leftJoin(
        secondarySendingSource,
        eq(
          secondarySendingSource.id,
          sendingDomains.secondarySendingSourceId,
        ),
      )
      .leftJoin(
        primaryEngageSendingSource,
        eq(
          primaryEngageSendingSource.id,
          sendingDomains.engageSendingSourceId,
        ),
      )
      .leftJoin(
        secondaryEngageSendingSource,
        eq(
          secondaryEngageSendingSource.id,
          sendingDomains.engageSecSendingSourceId,
        ),
      )
      .where(eq(sendingDomains.name, domain))
      .limit(1)

    if (!sendingSource) return null

    const sources = sendingSource as unknown as {
      primarySendingSource: SendingSource
      secondarySendingSource: SendingSource
      primaryEngageSendingSource: SendingSource
      secondaryEngageSendingSource: SendingSource
    }

    function getSendingDetailsFromSource(source: SendingSource) {
      return {
        source_address: source.address,
        ehlo_domain: source.ehloDomain,
        socks5_proxy_server: source.proxyServer,
      }
    }

    return {
      domain: sendingSource.sendingDomains,
      send: {
        primary: getSendingDetailsFromSource(sources.primarySendingSource),
        secondary: getSendingDetailsFromSource(
          sources.secondarySendingSource,
        ),
      },
      engage: {
        primary: getSendingDetailsFromSource(
          sources.primaryEngageSendingSource,
        ),
        secondary: getSendingDetailsFromSource(
          sources.secondaryEngageSendingSource,
        ),
      },
    }
  }

  async findByDomain(domain: string) {
    const [sendingDomain] = await this.database
      .select()
      .from(sendingDomains)
      .where(eq(sendingDomains.name, domain))
      .limit(1)

    return sendingDomain
  }
}
