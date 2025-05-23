import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { container } from '#root/core/utils/typi.js'

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
