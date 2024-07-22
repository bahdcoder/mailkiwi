import { CreateBroadcastDto } from "@/domains/broadcasts/dto/create_broadcast_dto.js"
import { BroadcastRepository } from "@/domains/broadcasts/repositories/broadcast_repository.js"
import { container } from "@/utils/typi.ts"

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
