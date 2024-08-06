import type { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js";
import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { makeDatabase } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import { broadcasts, sends } from "@/database/schema/schema.js";
import type {
  BroadcastWithEmailContent,
  UpdateSetBroadcastInput,
} from "@/database/schema/types.js";
import { eq, sql } from "drizzle-orm";

export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async create(data: CreateBroadcastDto, teamId: string) {
    const id = this.cuid();
    await this.database.insert(broadcasts).values({ ...data, id, teamId });

    return { id };
  }

  async summary(
    broadcastId: string,
  ): Promise<{ totalSent: number; totalFailed: number }> {
    const query: any = await this.database.execute(sql`
      SELECT
      COUNT(
        CASE
          WHEN status = 'SENT' THEN 1
        END
      ) AS totalSent,
      COUNT(
        CASE 
          WHEN status = 'FAILED' THEN 1
        END
      ) AS totalFailed
    FROM
      ${sends}
    WHERE
      broadcastId = ${broadcastId};
  `);

    return query?.[0]?.[0];
  }

  async update(
    id: string,
    { sendAt, ...payload }: Partial<UpdateSetBroadcastInput>,
  ) {
    await this.database
      .update(broadcasts)
      .set({
        ...payload,
        ...(sendAt ? { sendAt: new Date(sendAt as string) } : {}),
      })
      .where(eq(broadcasts.id, id));
    return { id };
  }

  async delete(id: string) {
    await this.database.delete(broadcasts).where(eq(broadcasts.id, id));

    return { id };
  }

  async findById(id: string, opts?: { loadAbTestVariants?: boolean }) {
    const broadcast = await this.database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
      with: {
        emailContent: true,
        abTestVariants: opts?.loadAbTestVariants
          ? {
              with: {
                emailContent: true,
              },
            }
          : undefined,
      },
    });

    return broadcast as BroadcastWithEmailContent;
  }

  async findAll() {
    return this.database.query.broadcasts.findMany();
  }
}
