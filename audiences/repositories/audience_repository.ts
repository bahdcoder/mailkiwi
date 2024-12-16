import { WebsiteRepository } from "@/websites/repositories/website_repository.js"
import { and, eq } from "drizzle-orm"

import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { UpdateSetAudienceInput } from "@/database/database_schema_types.js"
import { KnownAudienceProperty, audiences } from "@/database/schema.js"

import { ContainerKey } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

import { container } from "@/utils/typi.js"

export class AudienceRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = container.make(ContainerKey.database)) {
    super()
  }

  async getAllAudiences() {
    return []
  }

  async findById(audienceId: string) {
    const [audience] = await this.database
      .select()
      .from(audiences)
      .where(eq(audiences.id, audienceId))
      .limit(1)

    return audience
  }

  async getNewsletterAudienceForTeam(teamId: string) {
    const [newsletter] = await this.database
      .select()
      .from(audiences)
      .where(and(eq(audiences.teamId, teamId), eq(audiences.product, "letters")))
      .limit(1)

    return newsletter
  }

  async create(payload: CreateAudienceDto, teamId: string) {
    const id = this.cuid()

    await this.database.transaction(async (trx) => {
      await trx.insert(audiences).values({
        id,
        teamId,
        name: payload.name ?? payload.slug,
        product: payload.product,
      })

      await container.make(WebsiteRepository).transaction(trx).create({
        teamId,
        slug: payload.slug,
        audienceId: id,
      })
    })

    return { id }
  }

  async update(payload: UpdateSetAudienceInput, audienceId: string) {
    await this.database.update(audiences).set(payload).where(eq(audiences.id, audienceId))

    return { id: audienceId }
  }

  async updateKnownProperties(
    audienceId: string,
    knownProperties: KnownAudienceProperty[],
  ) {
    const audience = await this.findById(audienceId)

    if (!audience) {
      return
    }

    const existingPropertiesNames =
      audience.knownProperties?.map((property) => property.id) ?? []

    const propertiesToBeCreated = knownProperties.filter(
      (property) => !existingPropertiesNames.includes(property.id),
    )

    await this.database
      .update(audiences)
      .set({
        knownProperties: [...(audience.knownProperties ?? []), ...propertiesToBeCreated],
      })
      .where(eq(audiences.id, audienceId))
  }
}
