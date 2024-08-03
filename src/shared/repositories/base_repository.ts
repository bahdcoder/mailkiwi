import { cuid } from "@/shared/utils/cuid/cuid.js";
import type { DrizzleClient } from "@/database/client.js";

export class BaseRepository {
  protected database: DrizzleClient;

  transaction(transaction: DrizzleClient) {
    this.database = transaction as DrizzleClient;

    return this;
  }

  cuid() {
    return cuid();
  }
}
