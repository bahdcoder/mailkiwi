import { type SQL, and, eq, or } from "drizzle-orm"

import type { CreateTagDto } from "@/audiences/dto/tags/create_tag_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { InsertTag, Tag } from "@/database/schema/database_schema_types.js"
import { tags } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class TagRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async findById(id: string) {
    return this.findFirst({ where: eq(tags.id, id) })
  }

  async delete(id: string) {
    await this.database.delete(tags).where(eq(tags.id, id))
    return { id }
  }

  async findFirst(args: { where: SQL | undefined }) {
    const [tag] = await this.database
      .select()
      .from(tags)
      .where(args.where)
      .limit(1)

    return tag
  }

  async create(payload: CreateTagDto, audienceId: string) {
    const id = this.cuid()
    await this.database.insert(tags).values({ id, ...payload, audienceId })

    return { id }
  }

  async bulkCreate(tagsToCreate: InsertTag[]) {
    if (tagsToCreate.length === 0) {
      return []
    }
    await this.database.insert(tags).values(tagsToCreate)

    return tagsToCreate as Tag[]
  }
}
