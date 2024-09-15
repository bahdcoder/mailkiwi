import { eq } from "drizzle-orm"

import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { UpdateSetAudienceInput } from "@/database/schema/database_schema_types.ts"
import { audiences } from "@/database/schema/schema.js"

import { ContainerKey } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

import { container } from "@/utils/typi.js"

export class AudienceRepository extends BaseRepository {
  constructor(
    protected database: DrizzleClient = container.make(
      ContainerKey.database,
    ),
  ) {
    super()
  }

  async getAllAudiences() {
    return []
  }

  async findById(audienceId: number) {
    const [audience] = await this.database
      .select()
      .from(audiences)
      .where(eq(audiences.id, audienceId))

    return audience
  }

  async create(payload: CreateAudienceDto, teamId: number) {
    const result = await this.database.insert(audiences).values({
      name: payload.name,
      teamId,
    })

    return { id: this.primaryKey(result) }
  }

  async update(payload: UpdateSetAudienceInput, audienceId: number) {
    await this.database
      .update(audiences)
      .set(payload)
      .where(eq(audiences.id, audienceId))

    return { id: audienceId }
  }
}
