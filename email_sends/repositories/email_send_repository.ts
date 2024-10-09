import { eq } from "drizzle-orm"

import {
  EmailSend,
  InsertEmailSend,
  UpdateEmailSend,
} from "@/database/schema/database_schema_types.js"
import { emailSendEvents, emailSends } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class EmailSendRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  protected hasManyEvents = hasMany(this.database, {
    from: emailSends,
    to: emailSendEvents,
    foreignKey: emailSendEvents.emailSendId,
    primaryKey: emailSends.id,
    relationName: "events",
  })

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

      emailSendExists = { ...payload, id } as EmailSend
    } else {
      await this.update(
        emailSendExists.id,
        this.removeNullUndefined(payload),
      )
    }

    return { id: emailSendExists.id }
  }

  async update(emailSendId: string, payload: UpdateEmailSend) {
    await this.database
      .update(emailSends)
      .set(payload)
      .where(eq(emailSends.id, emailSendId))
  }

  async findBySendingIdWithEvents(emailSendId: string) {
    const [emailSend] = await this.hasManyEvents((query) =>
      query.where(eq(emailSends.sendingId, emailSendId)),
    )

    return emailSend
  }
}
