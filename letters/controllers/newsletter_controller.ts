import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

export class NewsletterController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([["GET", "/", this.index.bind(this)]], {
      prefix: "/teams/:teamId/letters",
    })
  }

  index() {
    // get the newsletter for this team.
  }
}
