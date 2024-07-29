import type { UpdateBroadcastDto } from '@/domains/broadcasts/dto/update_broadcast_dto.js'
import { BroadcastRepository } from '@/domains/broadcasts/repositories/broadcast_repository.js'
import { EmailContentRepository } from '@/domains/content/repositories/email_content_repository.ts'
import type { Broadcast } from '@/infrastructure/database/schema/types.ts'
import { container } from '@/utils/typi.js'

export class UpdateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private emailContentRepository = container.make(EmailContentRepository),
  ) {}

  async handle(broadcast: Broadcast, payload: UpdateBroadcastDto) {
    const { emailContent, ...broadcastPayload } = payload

    await this.broadcastRepository.update(broadcast.id, broadcastPayload)
    await this.emailContentRepository.updateForBroadcast(
      broadcast,
      emailContent,
    )

    return { id: broadcast.id }
  }
}
