import { eq } from "drizzle-orm"

import type {
  EmailContentVariant,
  UpdateBroadcastDto,
} from "@/broadcasts/dto/update_broadcast_dto.ts"

import type { DrizzleClient } from "@/database/client.js"
import type { Broadcast } from "@/database/schema/database_schema_types.js"
import { broadcasts, emailContents } from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class EmailContentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async bulkCreate(payload: EmailContentVariant[]) {
    const results = await Promise.all(
      payload.map((content) =>
        this.database.insert(emailContents).values(content),
      ),
    )

    return results.map((result) => this.primaryKey(result))
  }

  async bulkUpdate(
    payload: (EmailContentVariant & {
      emailContentId: number
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
    payload: UpdateBroadcastDto["emailContent"],
  ) {
    let emailContentId = broadcast.emailContentId

    if (!emailContentId) {
      const emailContentInsert = await this.database
        .insert(emailContents)
        .values({ ...payload })

      emailContentId = this.primaryKey(emailContentInsert)

      await this.database
        .update(broadcasts)
        .set({ emailContentId })
        .where(eq(broadcasts.id, broadcast.id))

      return { id: emailContentId }
    }

    await this.database
      .update(emailContents)
      .set({ ...payload })
      .where(eq(emailContents.id, emailContentId))

    return { id: emailContentId }
  }
}
