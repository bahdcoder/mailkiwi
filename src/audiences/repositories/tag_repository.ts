import { type SQL, and, eq, inArray, or, sql } from "drizzle-orm"

import type { CreateTagDto } from "@/audiences/dto/tags/create_tag_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { InsertTag } from "@/database/schema/database_schema_types.js"
import { tags } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class TagRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async findById(id: number) {
    return this.database.query.tags.findFirst({
      where: eq(tags.id, id),
    })
  }

  async delete(id: number) {
    await this.database.delete(tags).where(eq(tags.id, id))
    return { id }
  }

  async findFirst(args: { where: SQL | undefined }) {
    return this.database.query.tags.findFirst({
      where: args.where,
    })
  }

  async create(payload: CreateTagDto, audienceId: number) {
    const result = await this.database
      .insert(tags)
      .values({ ...payload, audienceId })

    return { id: this.primaryKey(result) }
  }

  async bulkCreate(tagsToCreate: InsertTag[]) {
    if (tagsToCreate.length === 0) {
      return []
    }
    await this.database.insert(tags).values(tagsToCreate)

    const tagIds = await this.database
      .select()
      .from(tags)
      .where(
        or(
          ...tagsToCreate.map((tagToCreate) =>
            and(
              eq(tags.name, tagToCreate.name),
              eq(tags.audienceId, tagToCreate.audienceId as number),
            ),
          ),
        ),
      )

    const tagIdsMap = new Map(
      tagIds.map((tag) => [`${tag.name}-${tag.audienceId}`, tag.id]),
    )

    return tagsToCreate.map((tagToCreate) => ({
      ...tagToCreate,
      id: tagIdsMap.get(
        `${tagToCreate.name}-${tagToCreate.audienceId}`,
      ) as number,
    }))
  }
}
