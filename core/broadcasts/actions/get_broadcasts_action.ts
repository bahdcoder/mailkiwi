import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { container } from '@kibamail/framework'

export class GetBroadcastsAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle() {
    return this.broadcastRepository.broadcasts().findAll()
  }
}
