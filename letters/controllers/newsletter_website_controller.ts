import { AddCustomNewsletterDomainSchema } from "@/letters/dto/add_custom_newsletter_domain_dto.js"
import { UpdateNewsletterWebsiteSchema } from "@/letters/dto/update_newsletter_website_dto.js"
import { UpdateNewsletterWebsitePageSchema } from "@/letters/dto/update_newsletter_website_page_dto.js"
import { CheckNewsletterDomainDnsConfiguration } from "@/letters/jobs/check_newsletter_domain_dns_configuration_job.js"
import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"
import { WebsitePageRepository } from "@/letters/repositories/website_page_repository.js"

import {
  Audience,
  NewsletterWebsite,
  WebsitePage,
} from "@/database/database_schema_types.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Queue } from "@/shared/queue/queue.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class NewsletterWebsiteController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        [
          "PUT",
          "/newsletter_websites/:newsletterWebsiteId/custom-domain",
          this.addCustomDomain.bind(this),
        ],
        [
          "PUT",
          "/newsletter_websites/:newsletterWebsiteId/",
          this.update.bind(this),
        ],
      ],
      {
        prefix: "/audiences/:audienceId",
      },
    )

    this.app.defineRoutes(
      [
        [
          "PUT",
          "/website_pages/:websitePageId",
          this.updateWebsitePage.bind(this),
        ],
      ],
      {
        prefix:
          "/audiences/:audienceId/newsletter_websites/:newsletterWebsiteId/",
      },
    )
  }

  protected async authorize(ctx: HonoContext) {
    this.ensureTeam(ctx)
    this.ensureCanAdministrate(ctx)

    const entityChecks = [
      this.ensureExists<Audience>(ctx, "audienceId"),
      this.ensureExists<NewsletterWebsite>(ctx, "newsletterWebsiteId"),
      ...(ctx.req.param("websitePageId")
        ? [this.ensureExists<WebsitePage>(ctx, "websitePageId")]
        : []),
    ] as const

    const [audience, newsletterWebsite, websitePage] =
      await Promise.all(entityChecks)

    this.ensureBelongsToTeam(ctx, audience)

    if (newsletterWebsite.audienceId !== audience.id) {
      throw E_UNAUTHORIZED(
        `This newsletter website does not belong to your selected audience. `,
      )
    }

    if (
      websitePage &&
      websitePage.newsletterWebsiteId !== newsletterWebsite.id
    ) {
      throw E_UNAUTHORIZED(
        `This website page does not belong to your selected newsletter website. `,
      )
    }

    return { audience, newsletterWebsite, websitePage }
  }

  async addCustomDomain(ctx: HonoContext) {
    const { newsletterWebsite } = await this.authorize(ctx)

    const payload = await this.validate(
      ctx,
      AddCustomNewsletterDomainSchema,
    )

    await container
      .make(NewsletterWebsiteRepository)
      .updateById(newsletterWebsite.id, { websiteDomain: payload.domain })

    await Queue.newsletter_websites().add(
      CheckNewsletterDomainDnsConfiguration.id,
      {
        newsletterWebsiteId: newsletterWebsite.id,
      },
    )

    return ctx.json({ id: newsletterWebsite.id })
  }

  async update(ctx: HonoContext) {
    const { newsletterWebsite } = await this.authorize(ctx)

    const payload = await this.validate(ctx, UpdateNewsletterWebsiteSchema)

    await container
      .make(NewsletterWebsiteRepository)
      .updateById(newsletterWebsite.id, payload)

    return ctx.json({ id: newsletterWebsite.id })
  }

  async updateWebsitePage(ctx: HonoContext) {
    const { websitePage } = await this.authorize(ctx)

    const payload = await this.validate(
      ctx,
      UpdateNewsletterWebsitePageSchema,
    )

    await container
      .make(WebsitePageRepository)
      .updateById(websitePage.id, payload)

    return ctx.json({ id: websitePage.id })
  }
}
