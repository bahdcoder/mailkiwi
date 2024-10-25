import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"

import type { CreateAudienceDto } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export class CreateAudienceAction {
  constructor(
    private database = makeDatabase(),
    private audienceRepository = container.make(AudienceRepository),
    private newsletterWebsiteRepository = container.make(
      NewsletterWebsiteRepository,
    ),
  ) {}

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

    const { audience } = await this.database.transaction(
      async function (trx) {
        const audience = await self.audienceRepository
          .transaction(trx)
          .create(payload, teamId)

        let newsletterWebsite: { id: string } | undefined = undefined

        if (payload.product === "letters") {
          newsletterWebsite = await self.newsletterWebsiteRepository
            .transaction(trx)
            .create({
              slug: payload.slug,
              audienceId: audience.id,
            })
        }

        return { audience, newsletterWebsite }
      },
    )

    return audience
  }
}
