import { cuid } from "@/domains/shared/utils/cuid/cuid.js"
import { DrizzleClient } from "@/infrastructure/database/client.js"

export class BaseRepository {
  protected database: DrizzleClient

  transaction(transaction: DrizzleClient) {
    this.database = transaction as DrizzleClient

    return this
  }

  cuid() {
    return cuid()
  }
}
