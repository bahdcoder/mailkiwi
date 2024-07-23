import { BroadcastRepository } from '@/domains/broadcasts/repositories/broadcast_repository.js'
import { container } from '@/utils/typi.ts'

export class DeleteBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle(broadcastId: string) {
    return this.broadcastRepository.delete(broadcastId)
  }
}
