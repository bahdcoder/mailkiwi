import { inject, injectable } from "tsyringe"
import { CreateAudienceDto } from "@/domains/audiences/dto/audiences/create_audience_dto"
import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"

@injectable()
export class CreateAudienceAction {
  constructor(
    @inject(AudienceRepository)
    private audienceRepository: AudienceRepository,
  ) {}

  handle = async (payload: CreateAudienceDto, teamId: string) => {
    const audience = await this.audienceRepository.createAudience(
      payload,
      teamId,
    )

    return audience
  }
}
