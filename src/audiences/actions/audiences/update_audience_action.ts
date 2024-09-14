import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { container } from "@/utils/typi.js"

export class UpdateAudienceAction {
  constructor(
    private audienceRepository = container.make(AudienceRepository),
  ) {}

  handle = async (payload: CreateAudienceDto, audienceId: number) => {
    const audience = await this.audienceRepository.update(
      payload,
      audienceId,
    )

    return audience
  }
}
