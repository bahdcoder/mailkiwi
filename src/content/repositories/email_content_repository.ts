import type { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.ts";
import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { makeDatabase } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import { broadcasts, emailContents } from "@/database/schema/schema.ts";
import type { Broadcast } from "@/database/schema/types.ts";
import { eq } from "drizzle-orm";

export class EmailContentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async updateForBroadcast(
    broadcast: Broadcast,
    payload: UpdateBroadcastDto["emailContent"],
  ) {
    let emailContentId = broadcast.emailContentId;

    if (!emailContentId) {
      emailContentId = this.cuid();

      await this.database
        .insert(emailContents)
        .values({ id: emailContentId, ...payload });

      await this.database
        .update(broadcasts)
        .set({ emailContentId })
        .where(eq(broadcasts.id, broadcast.id));

      return { id: emailContentId };
    }

    await this.database
      .update(emailContents)
      .set({ ...payload })
      .where(eq(emailContents.id, emailContentId));

    return { id: emailContentId };
  }
}
