import { eq } from 'drizzle-orm'

import type {
  EmailSend,
  InsertEmailSend,
  UpdateEmailSend,
} from '#root/database/database_schema_types.js'
import { emailSendEvents, emailSends } from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class EmailSendRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  protected hasManyEvents() {
    return hasMany(this.database, {
      from: emailSends,
      to: emailSendEvents,
      foreignKey: emailSendEvents.emailSendId,
      primaryKey: emailSends.id,
      relationName: 'events',
    })
  }

  async findBySendingId(sendingId: string) {
    const [emailSend] = await this.database
      .select()
      .from(emailSends)
      .where(eq(emailSends.sendingId, sendingId))
      .limit(1)

    return emailSend
  }

  async findById(id: string) {
    const [emailSend] = await this.database
      .select()
      .from(emailSends)
      .where(eq(emailSends.id, id))
      .limit(1)

    return emailSend
  }

  async create(id: string, payload: InsertEmailSend) {
    await this.database.insert(emailSends).values({ id, ...payload })

    return { id }
  }

  async bulkCreate(sends: { id: string; payload: InsertEmailSend }[]) {
    await this.database
      .insert(emailSends)
      .values(sends.map((send) => ({ id: send.id, ...send.payload })))

    return sends.map((send) => ({ id: send.id }))
  }

  async upsert(payload: InsertEmailSend) {
    let emailSendExists = await this.findBySendingId(payload.sendingId as string)

    if (!emailSendExists?.id) {
      const id = this.cuid()

      await this.database
        .insert(emailSends)
        .values({ id, ...this.removeNullUndefined(payload) })

      emailSendExists = { ...payload, id } as EmailSend
    } else {
      await this.update(emailSendExists.id, this.removeNullUndefined(payload))
    }

    return { id: emailSendExists.id }
  }

  async update(emailSendId: string, payload: UpdateEmailSend) {
    await this.database
      .update(emailSends)
      .set(this.removeNullUndefined(payload))
      .where(eq(emailSends.id, emailSendId))
  }

  async findBySendingIdWithEvents(emailSendId: string) {
    const [emailSend] = await this.hasManyEvents()((query) =>
      query.where(eq(emailSends.sendingId, emailSendId)),
    )

    return emailSend
  }

  async findByIdWithEvents(emailSendId: string) {
    const [emailSend] = await this.hasManyEvents()((query) =>
      query.where(eq(emailSends.id, emailSendId)),
    )

    return emailSend
  }
}
