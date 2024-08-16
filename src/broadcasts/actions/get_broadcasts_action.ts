import { container } from '@/utils/typi.ts'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

export class GetBroadcastsAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle() {
    return this.broadcastRepository.findAll()
  }
}
