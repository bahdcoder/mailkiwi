import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"

import { GenerateWebsiteFromJsonTool } from "@/tools/website/generate_website_from_json_tool.js"

import { ContainerKey, makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class NewsletterController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // reverse proxy will programmatically route traffic from fastmedia.kibaletters.com/* -> http://hono_server/letters/fastmedia/*

    // /letters/:newsletterWebsiteSlug -> this returns home page of newsletter
    // /letters/:newsletterWebsiteSlug/l/how-to-land-a-remote-job-in-tech -> this returns a single letter page
    // /letters/:newsletterWebsiteSlug/* -> this returns any matching page from all the pages saved in the database.
    // /letters/:newsletterWebsiteSlug/.wellknown/acme-challenge

    this.app.defineRoutes(
      [
        [
          "GET",
          "/.well-known/acme-challenge/:token",
          this.acmeChallenge.bind(this),
        ],
        ["GET", "/:websitePageSlug?", this.index.bind(this)],
        ["GET", "/l/:newsletterBroadcastSlug", this.index.bind(this)],
      ],
      {
        prefix: "/letters/:newsletterWebsiteSlug",
        middleware: [],
      },
    )
  }

  async acmeChallenge(ctx: HonoContext) {
    const website = await container
      .make(NewsletterWebsiteRepository)
      .findBySlugAndToken(
        ctx.req.param("newsletterWebsiteSlug"),
        ctx.req.param("token"),
      )

    if (!website) {
      return ctx.notFound()
    }

    return ctx.text(
      website.websiteSslCertChallengeKeyAuthorization as string,
    )
  }

  async index(ctx: HonoContext) {
    // get the home page for this newsletter.
    // each newsletter is hosted on its own domain.
    // the host will be in the form: slug.kibaletters.com

    const website = await container
      .make(NewsletterWebsiteRepository)
      .findBySlugWithPages(ctx.req.param("newsletterWebsiteSlug"))

    if (!website) {
      return ctx.html("<h1>We could not find this page. </h1>", 404)
    }

    const websitePageSlug = ctx.req.param("websitePageSlug") ?? "/"

    const page = website.pages.find(
      (page) => page.path === websitePageSlug,
    )

    if (!page || page.publishedAt === null) {
      return ctx.html("<h1>We could not find this page. </h1>", 404)
    }

    const html = await new GenerateWebsiteFromJsonTool(
      page.websiteContent,
    ).toHtml()

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
        .split("\n")
        .map((line) => line.trim())
        .join(""),
    )
  }
}
