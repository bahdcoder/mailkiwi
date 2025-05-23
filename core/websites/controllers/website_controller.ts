import { WEBSITES_DOMAIN, appEnv } from '#root/core/app/env/app_env.js'
import { InjectEmailAction } from '#root/core/injector/actions/inject_email_action.js'
import { InjectEmailSchemaDto } from '#root/core/injector/dto/inject_email_dto.js'
import { CreateContactSessionAction } from '#root/core/websites/actions/create_contact_session_action.js'
import { AddCustomWebsiteDomainSchema } from '#root/core/websites/dto/add_custom_website_domain_dto.js'
import { CreateContactSessionSchema } from '#root/core/websites/dto/create_contact_session_dto.js'
import { CreateWebsitePageSchema } from '#root/core/websites/dto/create_website_page_dto.js'
import { UpdateWebsiteSchema } from '#root/core/websites/dto/update_website_dto.js'
import { UpdateWebsitePageSchema } from '#root/core/websites/dto/update_website_page_dto.js'
import { CheckWebsiteDomainDnsConfiguration } from '#root/core/websites/jobs/check_website_domain_dns_configuration_job.js'
import { WebsitePageRepository } from '#root/core/websites/repositories/website_page_repository.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'
import { DateTime } from 'luxon'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { GenerateWebsiteFromJsonTool } from '#root/core/tools/website/generate_website_from_json_tool.js'

import {
  Audience,
  type Website,
  type WebsitePage,
} from '#root/database/database_schema_types.js'

import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { ContainerKey, makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { container } from '#root/core/utils/typi.js'

/**
 * WebsiteController manages website creation and rendering for landing pages.
 *
 * This controller is responsible for:
 * 1. Managing website pages and their content
 * 2. Handling website publishing and unpublishing
 * 3. Serving published website content to visitors
 * 4. Managing custom domains and SSL certificates
 * 5. Handling contact authentication for gated content
 *
 * The controller enables Kibamail users to create and manage landing pages,
 * subscription forms, and other web content that integrates with their
 * email marketing campaigns.
 */
export class WebsiteController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected websiteRepository = container.make(WebsiteRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['PUT', '/custom_domains', this.addCustomDomain.bind(this)],
        ['PUT', '/', this.update.bind(this)],
      ],
      {
        prefix: '/websites/:websiteId',
      },
    )

    this.app.defineRoutes(
      [
        ['PUT', '/website_pages/:websitePageId', this.updateWebsitePage.bind(this)],
        [
          'PUT',
          '/website_pages/:websitePageId/publish',
          this.publishWebsitePage.bind(this),
        ],
        [
          'PUT',
          '/website_pages/:websitePageId/unpublish',
          this.unpublishWebsitePage.bind(this),
        ],
        ['POST', '/website_pages/', this.createWebsitePage.bind(this)],
      ],
      {
        prefix: '/websites/:websiteId/',
      },
    )

    this.app.defineRoutes(
      [
        ['GET', '/.well-known/acme-challenge/:token', this.acmeChallenge.bind(this)],
        ['GET', '/:websitePageSlug?', this.index.bind(this)],

        // Contact sessions
        ['GET', '/sessions/:signature', this.confirmContactSession.bind(this)],
        ['POST', '/sessions/', this.createContactSession.bind(this)],
      ],
      {
        // TODO: wire this up to work with the reverse proxy.
        prefix: '/__websites/:websiteSlug',
        middleware: [],
      },
    )
  }

  /**
   * Authorizes website and page operations.
   *
   * Verifies that the user has permission to manage the website and its pages,
   * and ensures that requested resources exist and belong to the user's team.
   */
  protected async authorize(ctx: HonoContext) {
    this.ensureTeam(ctx)
    this.ensureCanAdministrate(ctx)

    const entityChecks = [
      this.ensureExists<Website>(ctx, 'websiteId'),
      ...(ctx.req.param('websitePageId')
        ? [this.ensureExists<WebsitePage>(ctx, 'websitePageId')]
        : []),
    ] as const

    const [website, websitePage] = await Promise.all(entityChecks)

    this.ensureBelongsToTeam(ctx, website)

    if (websitePage && websitePage.websiteId !== website.id) {
      throw E_UNAUTHORIZED(
        'This website page does not belong to your selected newsletter website. ',
      )
    }

    return { website, websitePage }
  }

  async addCustomDomain(ctx: HonoContext) {
    const { website } = await this.authorize(ctx)

    const payload = await this.validate(ctx, AddCustomWebsiteDomainSchema)

    await this.websiteRepository.updateById(website.id, {
      websiteDomain: payload.domain,
    })

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

    await container.make(WebsitePageRepository).updateById(websitePage.id, payload)

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

    const { id } = await container.make(WebsitePageRepository).create(payload, website.id)

    return ctx.json({ id })
  }

  async acmeChallenge(ctx: HonoContext) {
    const website = await this.websiteRepository.findBySlugAndToken(
      ctx.req.param('websiteSlug'),
      ctx.req.param('token'),
    )

    if (!website) {
      return ctx.notFound()
    }

    return ctx.text(website.websiteSslCertChallengeKeyAuthorization as string)
  }

  async index(ctx: HonoContext) {
    const website = await this.websiteRepository.findBySlugWithPages(
      ctx.req.param('websiteSlug'),
    )

    if (!website) {
      return ctx.html('<h1>We could not find this page. </h1>', 404)
    }

    const websitePageSlug = ctx.req.param('websitePageSlug') ?? '/'

    const page = website.pages.find((page) => page.path === websitePageSlug)

    if (!page || page.publishedAt === null) {
      return ctx.html('<h1>We could not find this page. </h1>', 404)
    }

    const html = await new GenerateWebsiteFromJsonTool(page.websiteContent).toHtml()

    const appVersion = container.make(ContainerKey.version)

    return ctx.html(
      /*html*/ `
        <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${page?.title}</title>
              <link rel="stylesheet" href="/assets/letters/kb-letters.css?v=${appVersion}">
              <meta name="description" content="${page?.description}">

              <meta property="og:title" content="">
              <meta property="og:type" content="">
              <meta property="og:url" content="">
              <meta property="og:image" content="">
              <meta property="og:image:alt" content="">

              <!--<link rel="icon" href="/favicon.ico" sizes="any">-->
              <!--<link rel="icon" href="/icon.svg" type="image/svg+xml">-->
              <!--<link rel="apple-touch-icon" href="icon.png">-->

              <link rel="manifest" href="site.webmanifest">
              <meta name="theme-color" content="#fafafa">
            </head>

            <body>
              ${html}
            </body>
          </html>
            `
        .split('\n')
        .map((line) => line.trim())
        .join(''),
    )
  }

  async createContactSession(ctx: HonoContext) {
    const website = await this.websiteRepository.findBySlugWithPages(
      ctx.req.param('websiteSlug'),
    )

    if (!website) {
      return ctx.notFound()
    }

    const payload = await this.validate(ctx, CreateContactSessionSchema)

    const contact = await container
      .make(ContactRepository)
      .findByEmailForTeam(payload.email, website.teamId)

    if (!contact) {
      throw E_VALIDATION_FAILED([
        {
          message: 'You do not seem to be subscribed. Please subscribe before you login.',
          field: 'email',
        },
      ])
    }

    await container.make(CreateContactSessionAction).handle(contact, website)

    return ctx.json({ id: contact.id })
  }

  async confirmContactSession(ctx: HonoContext) {
    const website = await this.websiteRepository.findBySlugWithPages(
      ctx.req.param('websiteSlug'),
    )

    if (!website) {
      return ctx.notFound()
    }

    const decodedSignature = new SignedUrlManager(appEnv.APP_KEY).decode(
      ctx.req.param('signature'),
    )

    if (!decodedSignature) {
      return ctx.redirect(this.getWebsiteHomePage(website))
    }

    const expiry = DateTime.fromISO(decodedSignature.metadata?.e as string)

    if (expiry < DateTime.now()) {
      return ctx.redirect(this.getWebsiteHomePage(website))
    }

    const contact = await container
      .make(ContactRepository)
      .findById(decodedSignature.original)

    await this.session.createForContact(ctx, contact.id)

    return ctx.redirect(this.getWebsiteHomePage(website))
  }
}
