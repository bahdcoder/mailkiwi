import { eq } from "drizzle-orm"
import { inject, injectable } from "tsyringe"

import { BaseRepository } from "@/domains/shared/repositories/base_repository.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { audiences } from "@/infrastructure/database/schema/schema.ts"

import { CreateAudienceDto } from "../dto/audiences/create_audience_dto.js"

@injectable()
export class AudienceRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
    super()
  }

  async getAllAudiences() {
    return []
  }

  async findById(audienceId: string) {
    return this.database.query.audiences.findFirst({
      where: eq(audiences.id, audienceId),
    })
  }

  async createAudience(payload: CreateAudienceDto, teamId: string) {
    const id = this.cuid()

    await this.database.insert(audiences).values({
      id,
      name: payload.name,
      teamId,
    })

    return { id }
  }

  async updateAudience(payload: CreateAudienceDto, audienceId: string) {
    await this.database
      .update(audiences)
      .set(payload)
      .where(eq(audiences.id, audienceId))

    return { id: audienceId }
  }
}
