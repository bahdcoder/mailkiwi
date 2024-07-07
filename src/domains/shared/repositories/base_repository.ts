import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { Prisma, PrismaClient } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library"
import { injectable } from "tsyringe"

@injectable()
export class BaseRepository {
  protected database: DrizzleClient

  transaction(transaction: DrizzleClient) {
    this.database = transaction as DrizzleClient

    return this
  }
}
