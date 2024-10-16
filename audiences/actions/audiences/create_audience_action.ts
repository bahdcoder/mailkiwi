import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export class CreateAudienceAction {
  constructor(
    private audienceRepository = container.make(AudienceRepository),
  ) {}

  handle = async (payload: CreateAudienceDto, teamId: string) => {
    if (payload.product === "letters") {
      const newsletterCreated =
        await this.audienceRepository.getNewsletterAudienceForTeam(teamId)

      if (newsletterCreated) {
        throw E_OPERATION_FAILED(
          "You may only have one newsletter per team. To create another newsletter, please create another team.",
        )
      }
    }
    const audience = await this.audienceRepository.create(payload, teamId)

    return audience
  }
}
