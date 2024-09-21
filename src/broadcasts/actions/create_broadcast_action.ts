import type { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { container } from "@/utils/typi.js"

export class CreateBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle(data: CreateBroadcastDto, teamId: string) {
    return this.broadcastRepository.create(data, teamId)
  }
}
