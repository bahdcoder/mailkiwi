import { broadcastGroups } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class BroadcastGroupRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  groups() {
    return this.crud(broadcastGroups)
  }
}
