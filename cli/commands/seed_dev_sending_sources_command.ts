import { command } from '@drizzle-team/brocli'
import { inArray, sql } from 'drizzle-orm'

import type { InsertSendingSource } from '#root/database/database_schema_types.js'
import { sendingSources } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export const seedDevSendingSourcesCommand = command({
  name: 'seed_dev_sending_sources',
  desc: 'Seed 3 sending sources for development (are all bound to socks5 proxy in docker containers).',
  async transform(opts) {
    return opts
  },
  async handler() {
    const database = makeDatabase()

    const sendingSourcesValues: InsertSendingSource[] = [
      {
        address: '172.20.0.45',
        ehloDomain: 'sv1.localkbmta.net',
        pool: 'send',
        proxyServer: '172.20.0.45:8000',
        status: 'active',
      },
      {
        address: '172.20.0.55',
        ehloDomain: 'sv2.localkbmta.net',
        pool: 'send',
        proxyServer: '172.20.0.55:8000',
        status: 'active',
      },
      {
        address: '172.20.0.65',
        ehloDomain: 'sv3.localkbmta.net',
        pool: 'send',
        proxyServer: '172.20.0.65:8000',
        status: 'active',
      },
      {
        address: '172.20.0.75',
        ehloDomain: 'sv4.localkbmta.net',
        pool: 'engage',
        proxyServer: '172.20.0.75:8000',
        status: 'active',
      },
      {
        address: '172.20.0.85',
        ehloDomain: 'sv5.localkbmta.net',
        pool: 'engage',
        proxyServer: '172.20.0.85:8000',
        status: 'active',
      },
      {
        address: '172.20.0.95',
        ehloDomain: 'sv6.localkbmta.net',
        pool: 'engage',
        proxyServer: '172.20.0.95:8000',
        status: 'active',
      },
    ]

    const existingSendingSources = await database
      .select()
      .from(sendingSources)
      .where(
        inArray(
          sendingSources.address,
          sendingSourcesValues.map((value) => value.address),
        ),
      )

    if (existingSendingSources.length === sendingSourcesValues.length) {
      return
    }

    await database
      .insert(sendingSources)
      .values(sendingSourcesValues)
      .onDuplicateKeyUpdate({
        set: {
          address: sql`values(${sendingSources.address})`,
        },
      })
  },
})
