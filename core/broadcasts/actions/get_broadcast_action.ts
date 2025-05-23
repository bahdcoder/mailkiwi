import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import type { Broadcast } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class GetBroadcastAction {
  constructor(private broadcastRepository = container.make(BroadcastRepository)) {}

  async handle(broadcast: Broadcast) {
    return {
      ...broadcast,
    }
  }
}
