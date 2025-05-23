import type { UpdateAudienceDto } from '#root/core/audiences/dto/audiences/update_audience_dto.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'

import { container } from '#root/core/utils/typi.js'

export class UpdateAudienceAction {
  constructor(private audienceRepository = container.make(AudienceRepository)) {}

  handle = async (payload: UpdateAudienceDto, audienceId: string) => {
    const { name, properties } = payload

    if (name) {
      await this.audienceRepository.update({ name }, audienceId)
    }

    if (properties) {
      await this.audienceRepository.updateKnownProperties(audienceId, properties)
    }

    return { id: audienceId }
  }
}
