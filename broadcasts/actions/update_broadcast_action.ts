import { AbTestVariantRepository } from "../repositories/ab_test_repository.js"

import type { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { EmailContentRepository } from "@/content/repositories/email_content_repository.js"

import type { Broadcast } from "@/database/schema/database_schema_types.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export class UpdateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private emailContentRepository = container.make(
      EmailContentRepository,
    ),
    private abTestVariantRepository = container.make(
      AbTestVariantRepository,
    ),
    private database = makeDatabase(),
  ) {}

  async handle(broadcast: Broadcast, payload: UpdateBroadcastDto) {
    const { emailContent, emailContentVariants, ...broadcastPayload } =
      payload

    await this.database.transaction(async (trx) => {
      const hasAbTestVariants =
        emailContentVariants && emailContentVariants.length > 0
      if (Object.keys(broadcastPayload).length > 0) {
        await this.broadcastRepository
          .transaction(trx)
          .update(broadcast.id, {
            ...broadcastPayload,
            isAbTest: hasAbTestVariants || broadcast.isAbTest,
          })
      }

      if (emailContent && Object.keys(emailContent).length > 0) {
        await this.emailContentRepository
          .transaction(trx)
          .updateForBroadcast(broadcast, emailContent)
      }

      if (emailContentVariants && emailContentVariants.length > 0) {
        await this.abTestVariantRepository
          .transaction(trx)
          .bulkUpsertVariants(emailContentVariants, broadcast.id)
      }
    })

    return { id: broadcast.id }
  }
}
