import { AbTestVariantRepository } from '../repositories/ab_test_repository.js'

import type { UpdateBroadcastDto } from '#root/core/broadcasts/dto/update_broadcast_dto.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { EmailContentRepository } from '#root/core/content/repositories/email_content_repository.js'

import type { Broadcast } from '#root/database/database_schema_types.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

import { container } from '#root/core/utils/typi.js'
import { DateTime } from 'luxon'

export class UpdateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private emailContentRepository = container.make(EmailContentRepository),
    private abTestVariantRepository = container.make(AbTestVariantRepository),
    private database = makeDatabase(),
  ) {}

  async handle(broadcast: Broadcast, payload: UpdateBroadcastDto) {
    const { emailContent, emailContentVariants, ...broadcastPayload } = payload

    await this.database.transaction(async (trx) => {
      const hasAbTestVariants = emailContentVariants && emailContentVariants.length > 0
      if (Object.keys(broadcastPayload).length > 0) {
        await this.broadcastRepository.transaction(trx).update(broadcast.id, {
          ...broadcastPayload,
          isAbTest: hasAbTestVariants || broadcast.isAbTest,
          updatedAt: DateTime.now().toJSDate(),
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
