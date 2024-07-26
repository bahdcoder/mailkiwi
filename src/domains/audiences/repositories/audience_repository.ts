import { eq } from 'drizzle-orm'

import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { ContainerKey } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { audiences } from '@/infrastructure/database/schema/schema.js'
import { container } from '@/utils/typi.js'

import type { CreateAudienceDto } from '@/domains/audiences/dto/audiences/create_audience_dto.js'

export class AudienceRepository extends BaseRepository {
  constructor(
    protected database: DrizzleClient = container.make(ContainerKey.database),
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
