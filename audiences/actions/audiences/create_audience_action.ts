import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { container } from "@/utils/typi.js"

export class CreateAudienceAction {
  constructor(private audienceRepository = container.make(AudienceRepository)) {}

  handle = async (payload: CreateAudienceDto, teamId: string) => {
    if (payload.product === "letters") {
      const newsletterCreated =
        await this.audienceRepository.getNewsletterAudienceForTeam(teamId)

      if (newsletterCreated) {
        throw E_VALIDATION_FAILED([
          {
            message:
              "You may only have one newsletter per team. To create another newsletter, please create another team.",
            field: "slug",
          },
        ])
      }
    }

    const self = this

    const audience = await self.audienceRepository.create(payload, teamId)

    return audience
  }
}
