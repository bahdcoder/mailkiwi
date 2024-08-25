import type { EmailContentVariant } from "../dto/update_broadcast_dto.ts"
import { eq } from "drizzle-orm"

import { EmailContentRepository } from "@/content/repositories/email_content_repository.ts"

import type { DrizzleClient } from "@/database/client.js"
import type { InsertAbTestVariant } from "@/database/schema/database_schema_types.js"
import { abTestVariants } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

import { container } from "@/utils/typi.ts"

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
    return this.database
      .select({
        id: abTestVariants.id,
        broadcastId: abTestVariants.broadcastId,
        emailContentId: abTestVariants.emailContentId,
      })
      .from(abTestVariants)
      .where(eq(abTestVariants.id, variantId))
  }

  async bulkUpsertVariants(
    variants: EmailContentVariant[],
    broadcastId: string,
  ) {
    const variantsToInsert = variants.filter(
      (variant) => !variant.abTestVariantId,
    )

    const variantsToUpdate = variants.filter(
      (variant) => variant.abTestVariantId,
    )

    const emailContentIdsToUpdate = await Promise.all(
      variantsToUpdate.map((variant) =>
        this.findById(variant.abTestVariantId as string),
      ),
    )

    const variantsToUpdateWithEmailContentIds = variantsToUpdate.map(
      (variant, idx) => ({
        ...variant,
        emailContentId: emailContentIdsToUpdate[idx][0].emailContentId,
      }),
    )

    this.emailContentRepository.transaction(this.database)

    const emailContentIds =
      await this.emailContentRepository.bulkCreate(variantsToInsert)

    await this.emailContentRepository.bulkUpdate(
      variantsToUpdateWithEmailContentIds,
    )

    const variantsWithEmailContentIds = variantsToInsert.map(
      (variant, idx) => ({
        ...variant,
        emailContentId: emailContentIds[idx],
      }),
    )

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
