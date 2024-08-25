import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { container } from "@/utils/typi.ts"

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
