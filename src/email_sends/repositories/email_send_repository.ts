import { eq } from "drizzle-orm"

import {
  EmailSend,
  InsertEmailSend,
  UpdateEmailSend,
} from "@/database/schema/database_schema_types.js"
import { emailSends } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class EmailSendRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async findBySendingId(sendingId: string) {
    const [emailSend] = await this.database
      .select()
      .from(emailSends)
      .where(eq(emailSends.sendingId, sendingId))
      .limit(1)

    return emailSend
  }

  async upsert(payload: InsertEmailSend) {
    let emailSendExists = await this.findBySendingId(payload.sendingId)

    if (!emailSendExists?.id) {
      const id = this.cuid()

      await this.database
        .insert(emailSends)
        .values({ id, ...this.removeNullUndefined(payload) })

      emailSendExists.id = id
    } else {
      await this.update(emailSendExists.id, payload)
    }

    return { id: emailSendExists.id }
  }

  async update(emailSendId: string, payload: UpdateEmailSend) {
    await this.database
      .update(emailSends)
      .set(payload)
      .where(eq(emailSends.id, emailSendId))
  }
}
