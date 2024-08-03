import type { CreateTagDto } from "@/audiences/dto/tags/create_tag_dto.js";
import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { makeDatabase } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import { tags } from "@/database/schema/schema.js";
import { type SQL, SQLWrapper, eq } from "drizzle-orm";
export class TagRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async findById(id: string) {
    return this.database.query.tags.findFirst({
      where: eq(tags.id, id),
    });
  }

  async delete(id: string) {
    await this.database.delete(tags).where(eq(tags.id, id));
    return { id };
  }

  async findFirst(args: { where: SQL | undefined }) {
    return this.database.query.tags.findFirst({ where: args.where });
  }

  async create(payload: CreateTagDto, audienceId: string) {
    const id = this.cuid();

    await this.database.insert(tags).values({ ...payload, id, audienceId });

    return { id };
  }
}
