import { BroadcastRepository } from '@/domains/broadcasts/repositories/broadcast_repository.js'
import type { Broadcast } from '@/infrastructure/database/schema/types.js'
import { container } from '@/utils/typi.ts'

export class GetBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle(broadcast: Broadcast) {
    return {
      ...broadcast,
      summary: await this.broadcastRepository.summary(broadcast.id),
    }
  }
}
