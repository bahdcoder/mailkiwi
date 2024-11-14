import { AddCustomWebsiteDomainSchema } from "@/letters/dto/add_custom_newsletter_domain_dto.js"
import { CreateWebsitePageSchema } from "@/letters/dto/create_website_page_dto.js"
import { UpdateWebsiteSchema } from "@/letters/dto/update_website_dto.js"
import { UpdateWebsitePageSchema } from "@/letters/dto/update_website_page_dto.js"
import { CheckWebsiteDomainDnsConfiguration } from "@/letters/jobs/check_website_domain_dns_configuration_job.js"
import { WebsitePageRepository } from "@/letters/repositories/website_page_repository.js"
import { WebsiteRepository } from "@/letters/repositories/website_repository.js"

import {
  Audience,
  Website,
  WebsitePage,
} from "@/database/database_schema_types.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Queue } from "@/shared/queue/queue.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class WebsiteController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ["PUT", "/custom_domains", this.addCustomDomain.bind(this)],
        ["PUT", "/", this.update.bind(this)],
      ],
      {
        prefix: "/websites/:websiteId",
      },
    )

    this.app.defineRoutes(
      [
        [
          "PUT",
          "/website_pages/:websitePageId",
          this.updateWebsitePage.bind(this),
        ],
        [
          "PUT",
          "/website_pages/:websitePageId/publish",
          this.publishWebsitePage.bind(this),
        ],
        [
          "PUT",
          "/website_pages/:websitePageId/unpublish",
          this.unpublishWebsitePage.bind(this),
        ],
        ["POST", "/website_pages/", this.createWebsitePage.bind(this)],
      ],
      {
        prefix: "/websites/:websiteId/",
      },
    )
  }

  protected async authorize(ctx: HonoContext) {
    this.ensureTeam(ctx)
    this.ensureCanAdministrate(ctx)

    const entityChecks = [
      this.ensureExists<Website>(ctx, "websiteId"),
      ...(ctx.req.param("websitePageId")
        ? [this.ensureExists<WebsitePage>(ctx, "websitePageId")]
        : []),
    ] as const

    const [website, websitePage] = await Promise.all(entityChecks)

    this.ensureBelongsToTeam(ctx, website)

    if (websitePage && websitePage.websiteId !== website.id) {
      throw E_UNAUTHORIZED(
        `This website page does not belong to your selected newsletter website. `,
      )
    }

    return { website, websitePage }
  }

  async addCustomDomain(ctx: HonoContext) {
    const { website } = await this.authorize(ctx)

    const payload = await this.validate(ctx, AddCustomWebsiteDomainSchema)

    await container
      .make(WebsiteRepository)
      .updateById(website.id, { websiteDomain: payload.domain })

    await Queue.websites().add(CheckWebsiteDomainDnsConfiguration.id, {
      websiteId: website.id,
    })

    return ctx.json({ id: website.id })
  }

  async update(ctx: HonoContext) {
    const { website } = await this.authorize(ctx)

    const payload = await this.validate(ctx, UpdateWebsiteSchema)

    await container.make(WebsiteRepository).updateById(website.id, payload)

    return ctx.json({ id: website.id })
  }

  async updateWebsitePage(ctx: HonoContext) {
    const { websitePage } = await this.authorize(ctx)

    const payload = await this.validate(ctx, UpdateWebsitePageSchema)

    await container
      .make(WebsitePageRepository)
      .updateById(websitePage.id, payload)

    return ctx.json({ id: websitePage.id })
  }

  async publishWebsitePage(ctx: HonoContext) {
    const { websitePage } = await this.authorize(ctx)

    await container.make(WebsitePageRepository).publish(websitePage)

    return ctx.json({ id: websitePage.id })
  }

  async unpublishWebsitePage(ctx: HonoContext) {
    const { websitePage } = await this.authorize(ctx)

    await container.make(WebsitePageRepository).unpublish(websitePage)

    return ctx.json({ id: websitePage.id })
  }

  async createWebsitePage(ctx: HonoContext) {
    const { website } = await this.authorize(ctx)

    const payload = await this.validate(ctx, CreateWebsitePageSchema)

    const { id } = await container
      .make(WebsitePageRepository)
      .create(payload, website.id)

    return ctx.json({ id })
  }
}
