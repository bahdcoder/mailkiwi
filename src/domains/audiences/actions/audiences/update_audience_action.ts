import { inject, injectable } from "tsyringe"

import { CreateAudienceDto } from "@/domains/audiences/dto/audiences/create_audience_dto"
import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"

@injectable()
export class UpdateAudienceAction {
  constructor(
    @inject(AudienceRepository)
    private audienceRepository: AudienceRepository,
  ) {}

  handle = async (payload: CreateAudienceDto, audienceId: string) => {
    const audience = await this.audienceRepository.updateAudience(
      payload,
      audienceId,
    )

    return audience
  }
}
