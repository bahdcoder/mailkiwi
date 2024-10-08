import { InjectTrackingLinksIntoEmailAction } from "@/kumomta/actions/inject_tracking_links_into_email_action.js"
import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class TrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["POST", "/mta/smtp/message", this.store.bind(this)]],
      {
        prefix: "/",
        middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
      },
    )
  }

  async store(ctx: HonoContext) {
    const { message, domain } = await ctx.req.json()

    const sendingDomainRepository = container.make(SendingDomainRepository)

    const sendingDomain =
      await sendingDomainRepository.findByDomain(domain)

    if (
      !sendingDomainRepository.getTrackingStatus(sendingDomain)
        .trackingEnabled
    ) {
      return ctx.json({ contnet: message })
    }

    const content = await container
      .make(InjectTrackingLinksIntoEmailAction)
      .handle(
        message,
        `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`,
      )

    return ctx.json({
      content: content,
    })
  }
}
