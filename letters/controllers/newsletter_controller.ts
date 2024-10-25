import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

export class NewsletterController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // reverse proxy will programmatically route traffic from fastmedia.kibaletters.com/* -> http://hono_server/letters/fastmedia/*

    // /letters/:newsletterWebsiteSlug -> this returns home page of newsletter
    // /letters/:newsletterWebsiteSlug/l/how-to-land-a-remote-job-in-tech -> this returns a single letter page
    // /letters/:newsletterWebsiteSlug/* -> this returns any matching page from all the pages saved in the database.

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["GET", "/l/:newsletterBroadcastSlug", this.index.bind(this)],
        ["GET", "/*", this.index.bind(this)],
      ],
      {
        prefix: "/letters/:newsletterWebsiteSlug",
        middleware: [],
      },
    )
  }

  index(ctx: HonoContext) {
    // get the home page for this newsletter.
    // each newsletter is hosted on its own domain.
    // the host will be in the form: slug.kibaletters.com
  }
}
