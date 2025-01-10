import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { container } from "@/utils/typi.js"

export class CreateAudienceAction {
  constructor(private audienceRepository = container.make(AudienceRepository)) {}

  handle = async (payload: CreateAudienceDto, teamId: string) => {
    const self = this

    const audienceForTeam = await self.audienceRepository.getAudienceForTeam(teamId)

    if (audienceForTeam) {
      throw E_VALIDATION_FAILED([
        {
          message: "You may only have one audience per team.",
          field: "slug",
        },
      ])
    }

    const audience = await self.audienceRepository.create(payload, teamId)

    return audience
  }
}
