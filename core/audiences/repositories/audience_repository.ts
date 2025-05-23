import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'
import { and, eq } from 'drizzle-orm'

import type { CreateAudienceDto } from '#root/core/audiences/dto/audiences/create_audience_dto.js'

import type { DrizzleClient } from '#root/database/client.js'
import {
  Audience,
  type UpdateSetAudienceInput,
} from '#root/database/database_schema_types.js'
import { type KnownAudienceProperty, audiences } from '#root/database/schema.js'

import { ContainerKey } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

import { container } from '#root/core/utils/typi.js'

export class AudienceRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = container.make(ContainerKey.database)) {
    super()
  }

  async getAllAudiences() {
    return []
  }

  audiences() {
    return this.crud(audiences)
  }

  async findById(audienceId: string) {
    const [audience] = await this.database
      .select()
      .from(audiences)
      .where(eq(audiences.id, audienceId))
      .limit(1)

    return audience
  }

  async getAudienceForTeam(teamId: string) {
    const [audience] = await this.database
      .select()
      .from(audiences)
      .where(and(eq(audiences.teamId, teamId)))
      .limit(1)

    return audience

    // return self.cache
    //   .namespace("teams")
    //   .get([teamId, "audience"].join("/"), async function () {
    //     const [audience] = await self.database
    //       .select()
    //       .from(audiences)
    //       .where(and(eq(audiences.teamId, teamId)))
    //       .limit(1)

    //     return audience
    //   })
  }

  async create(payload: CreateAudienceDto, teamId: string) {
    const id = this.cuid()

    await this.database.insert(audiences).values({
      id,
      teamId,
      name: payload.name ?? payload.slug,
    })

    await container.make(WebsiteRepository).create({
      teamId,
      slug: payload.slug,
      audienceId: id,
    })
    return { id }
  }

  async update(payload: UpdateSetAudienceInput, audienceId: string) {
    await this.database.update(audiences).set(payload).where(eq(audiences.id, audienceId))

    return { id: audienceId }
  }

  async updateKnownProperties(audienceId: string, properties: KnownAudienceProperty[]) {
    const audience = await this.findById(audienceId)

    if (!audience) {
      return
    }

    const existingProperties: Record<string, KnownAudienceProperty> = {}
    const incomingProperties: Record<string, KnownAudienceProperty> = {}

    if (!audience.knownProperties) {
      audience.knownProperties = []
    }

    for (const property of audience.knownProperties || []) {
      existingProperties[property.id] = property
    }

    for (const property of properties) {
      incomingProperties[property.id] = property
    }

    const propertiesToBeCreated = properties.filter(
      (property) => !existingProperties[property.id],
    )

    const propertiesToBeUpdated = properties.filter(
      (property) => existingProperties[property.id],
    )

    const propertiesUnchanged = audience.knownProperties?.filter(
      (property) => !incomingProperties[property.id],
    )

    await this.database
      .update(audiences)
      .set({
        knownProperties: [
          ...propertiesUnchanged,
          ...propertiesToBeUpdated.map((property) => ({
            ...existingProperties[property.id],
            ...property,
          })),
          ...propertiesToBeCreated,
        ],
      })
      .where(eq(audiences.id, audienceId))
  }
}
