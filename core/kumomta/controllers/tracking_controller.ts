import { InjectTrackingLinksIntoEmailAction } from '#root/core/kumomta/actions/inject_tracking_links_into_email_action.js'
import { AuthorizeMtaCallsMiddleware } from '#root/core/kumomta/middleware/authorize_mta_calls_middleware.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * TrackingController handles the injection of tracking elements into outgoing emails.
 *
 * This controller is responsible for:
 * 1. Processing outgoing email messages before they're sent
 * 2. Injecting tracking pixels and rewriting links for analytics
 * 3. Ensuring tracking is only applied when enabled for a domain
 *
 * The controller works with the mail transfer agent (MTA) to modify email content
 * during the sending process, enabling essential marketing features like open and
 * click tracking without requiring manual implementation by users.
 */
export class TrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/mta/smtp/message', this.store.bind(this)]], {
      prefix: '/',
      middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
    })
  }

  /**
   * Processes an outgoing email message to inject tracking elements.
   *
   * Adds tracking pixels and rewrites links in the email content when tracking
   * is enabled for the sending domain, otherwise returns the original message.
   */
  async store(ctx: HonoContext) {
    const { message, domain } = await ctx.req.json()

    const sendingDomainRepository = container.make(SendingDomainRepository)

    const sendingDomain = await sendingDomainRepository.findByDomain(domain)

    if (!sendingDomainRepository.getTrackingStatus(sendingDomain).trackingEnabled) {
      return ctx.json({ content: message })
    }

    const content = await container
      .make(InjectTrackingLinksIntoEmailAction)
      .handle(message, `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`)

    return ctx.json({
      content: content,
    })
  }
}
