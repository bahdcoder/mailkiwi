import { eq } from 'drizzle-orm'
import type { EmailContentVariant } from '../dto/update_broadcast_dto.js'

import { EmailContentRepository } from '#root/core/content/repositories/email_content_repository.js'

import type { DrizzleClient } from '#root/database/client.js'
import type { InsertAbTestVariant } from '#root/database/database_schema_types.js'
import { abTestVariants } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

import { container } from '#root/core/utils/typi.js'

export class AbTestVariantRepository extends BaseRepository {
  constructor(
    protected database: DrizzleClient = makeDatabase(),
    private emailContentRepository = container.make(EmailContentRepository),
  ) {
    super()
  }

  async create(payload: InsertAbTestVariant) {
    const id = this.cuid()
    await this.database.insert(abTestVariants).values({ id, ...payload })

    return { id }
  }

  async findById(variantId: string) {
    const [abTestVariant] = await this.database
      .select({
        id: abTestVariants.id,
        broadcastId: abTestVariants.broadcastId,
        emailContentId: abTestVariants.emailContentId,
      })
      .from(abTestVariants)
      .where(eq(abTestVariants.id, variantId))
      .limit(1)

    return abTestVariant
  }

  async bulkUpsertVariants(variants: EmailContentVariant[], broadcastId: string) {
    const variantsToInsert = variants.filter((variant) => !variant.abTestVariantId)

    const variantsToUpdate = variants.filter((variant) => variant.abTestVariantId)

    const emailContentIdsToUpdate = await Promise.all(
      variantsToUpdate.map((variant) => this.findById(variant.abTestVariantId as string)),
    )

    const variantsToUpdateWithEmailContentIds = variantsToUpdate.map((variant, idx) => ({
      ...variant,
      emailContentId: emailContentIdsToUpdate[idx].emailContentId,
    }))

    this.emailContentRepository.transaction(this.database)

    const emailContentIds = await this.emailContentRepository.bulkCreate(variantsToInsert)

    await this.emailContentRepository.bulkUpdate(variantsToUpdateWithEmailContentIds)

    const variantsWithEmailContentIds = variantsToInsert.map((variant, idx) => ({
      ...variant,
      emailContentId: emailContentIds[idx],
    }))

    await this.database.insert(abTestVariants).values(
      variantsWithEmailContentIds.map((variant) => ({
        broadcastId,
        emailContentId: variant.emailContentId,
        name: variant.name as string,
        weight: variant.weight,
      })),
    )
  }
}
