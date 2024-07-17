import { inject, injectable } from "tsyringe"

import { CreateTagDto } from "@/domains/audiences/dto/tags/create_tag_dto.ts"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { tags } from "@/infrastructure/database/schema/schema.ts"

@injectable()
export class TagRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
    super()
  }

  async create(payload: CreateTagDto, audienceId: string) {
    const id = this.cuid()

    await this.database.insert(tags).values({ ...payload, audienceId })

    return { id }
  }
}
