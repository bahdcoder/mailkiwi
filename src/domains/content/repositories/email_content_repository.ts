import type { UpdateBroadcastDto } from '@/domains/broadcasts/dto/update_broadcast_dto.ts'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { emailContents } from '@/infrastructure/database/schema/schema.ts'
import type { Broadcast } from '@/infrastructure/database/schema/types.ts'
import { eq } from 'drizzle-orm'

export class EmailContentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
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
        .values({ id: emailContentId, ...payload })

      return { id: emailContentId }
    }

    await this.database
      .update(emailContents)
      .set({ ...payload })
      .where(eq(emailContents.id, emailContentId))

    return { id: emailContentId }
  }
}
