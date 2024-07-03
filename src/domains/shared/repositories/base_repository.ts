import { Prisma, PrismaClient } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library"
import { injectable } from "tsyringe"

@injectable()
export class BaseRepository {
  protected database: PrismaClient

  transaction(
    transaction: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
  ) {
    this.database = transaction as PrismaClient

    return this
  }
}
