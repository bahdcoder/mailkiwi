import type { CreateAudienceDto } from '@/domains/audiences/dto/audiences/create_audience_dto.js'
import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { container } from '@/utils/typi.js'

export class CreateAudienceAction {
  constructor(
    private audienceRepository = container.make(AudienceRepository),
  ) {}

  handle = async (payload: CreateAudienceDto, teamId: string) => {
    const audience = await this.audienceRepository.createAudience(
      payload,
      teamId,
    )

    return audience
  }
}
