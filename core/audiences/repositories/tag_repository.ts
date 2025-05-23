import { type SQL, and, eq, or } from 'drizzle-orm'

import type { CreateTagDto } from '#root/core/audiences/dto/tags/create_tag_dto.js'

import type { DrizzleClient } from '#root/database/client.js'
import type { InsertTag, Tag } from '#root/database/database_schema_types.js'
import { tags } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class TagRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  tags() {
    return this.crud(tags)
  }

  async findById(id: string) {
    return this.findFirst({ where: eq(tags.id, id) })
  }

  async delete(id: string) {
    await this.database.delete(tags).where(eq(tags.id, id))
    return { id }
  }

  async findFirst(args: { where: SQL | undefined }) {
    const [tag] = await this.database.select().from(tags).where(args.where).limit(1)

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

    const payload = tagsToCreate.map((tag) => ({
      ...tag,
      id: this.cuid(),
    }))

    await this.database.insert(tags).values(payload)

    return payload as Tag[]
  }
}
