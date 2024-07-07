import { injectable } from "tsyringe"

import { cuid } from "@/domains/shared/utils/cuid/cuid.ts"
import { DrizzleClient } from "@/infrastructure/database/client.ts"

@injectable()
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
