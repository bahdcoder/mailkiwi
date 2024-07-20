import { CreateTagDto } from "@/domains/audiences/dto/tags/create_tag_dto.js"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { makeDatabase } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.js"
import { tags } from "@/infrastructure/database/schema/schema.js"

export class TagRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(payload: CreateTagDto, audienceId: string) {
    const id = this.cuid()

    await this.database.insert(tags).values({ ...payload, audienceId })

    return { id }
  }
}
