import { eq } from 'drizzle-orm'

import type {
  EmailContentVariant,
  UpdateBroadcastDto,
} from '#root/core/broadcasts/dto/update_broadcast_dto.js'

import type { DrizzleClient } from '#root/database/client.js'
import type { Broadcast } from '#root/database/database_schema_types.js'
import { broadcasts, emailContents } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { DateTime } from 'luxon'

export class EmailContentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async bulkCreate(payload: EmailContentVariant[]) {
    const variants = payload.map((variant) => ({
      ...variant,
      id: this.cuid(),
    }))

    await Promise.all(
      variants.map((content) => this.database.insert(emailContents).values(content)),
    )

    return variants.map((variant) => variant.id)
  }

  async bulkUpdate(
    payload: (EmailContentVariant & {
      emailContentId: string
    })[],
  ) {
    await Promise.all(
      payload.map((content) =>
        this.database
          .update(emailContents)
          .set({ ...content })
          .where(eq(emailContents.id, content.emailContentId)),
      ),
    )
  }

  async updateForBroadcast(
    broadcast: Broadcast,
    payload: UpdateBroadcastDto['emailContent'],
  ) {
    let emailContentId = broadcast.emailContentId

    if (!emailContentId) {
      emailContentId = this.cuid()

      await this.database
        .insert(emailContents)
        .values({ ...payload, id: emailContentId, updatedAt: DateTime.now().toJSDate() })

      await this.database
        .update(broadcasts)
        .set({ emailContentId, updatedAt: DateTime.now().toJSDate() })
        .where(eq(broadcasts.id, broadcast.id))

      return { id: emailContentId }
    }

    await this.database
      .update(emailContents)
      .set({ ...payload, updatedAt: DateTime.now().toJSDate() })
      .where(eq(emailContents.id, emailContentId))

    return { id: emailContentId }
  }
}
