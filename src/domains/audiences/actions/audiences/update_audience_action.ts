import type { CreateAudienceDto } from '@/domains/audiences/dto/audiences/create_audience_dto.js'
import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { container } from '@/utils/typi.js'

export class UpdateAudienceAction {
  constructor(
    private audienceRepository: AudienceRepository = container.make(
      AudienceRepository,
    ),
  ) {}

  handle = async (payload: CreateAudienceDto, audienceId: string) => {
    const audience = await this.audienceRepository.updateAudience(
      payload,
      audienceId,
    )

    return audience
  }
}
