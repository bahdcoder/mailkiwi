import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { container } from '#root/core/utils/typi.js'

export class SummariseBroadcastAction {
  constructor(private broadcastRepository = container.make(BroadcastRepository)) {}

  async handle(broadcastId: string) {
    // return this.broadcastRepository.delete(broadcastId);
    //
  }
}
