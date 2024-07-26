import type { UpdateBroadcastDto } from '@/domains/broadcasts/dto/update_broadcast_dto.js'
import { BroadcastRepository } from '@/domains/broadcasts/repositories/broadcast_repository.js'
import { container } from '@/utils/typi.ts'

export class UpdateBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle(id: string, payload: UpdateBroadcastDto) {
    return this.broadcastRepository.update(id, payload)
  }
}
