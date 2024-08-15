import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'
import type { Broadcast } from '@/database/schema/types.js'
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
    }
  }
}
