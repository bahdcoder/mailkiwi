import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { container } from '@kibamail/framework'

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
