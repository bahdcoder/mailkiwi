import { cuid } from '@/shared/utils/cuid/cuid.js'
import type { DrizzleClient } from '@/database/client.js'

export class BaseRepository {
  protected database: DrizzleClient

  transaction(transaction: DrizzleClient) {
    this.database = transaction

    return this
  }

  cuid() {
    return cuid()
  }
}
