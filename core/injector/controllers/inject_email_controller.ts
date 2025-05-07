import { InjectEmailAction } from '@/injector/actions/inject_email_action.js'
import { InjectEmailSchema } from '@/injector/dto/inject_email_dto.js'
import { AuthorizeInjectorApiKeyMiddleware } from '@/injector/middleware/authorize_injector_api_key_middleware.js'
import { getDomainFromEmail } from '@/injector/utils/get_domain_from_email.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

/**
 * InjectEmailController handles direct email injection into the sending system.
 *
 * This controller is responsible for:
 * 1. Receiving email content through the API
 * 2. Validating sender permissions for the specified domain
 * 3. Injecting emails directly into the sending pipeline
 *
 * This controller provides a programmatic interface for applications to send emails
 * through Kibamail without using SMTP, which is particularly useful for integrations
 * and automated systems that need to send transactional or notification emails.
 */
export class InjectEmailController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/inject', this.index.bind(this)]], {
      middleware: [container.make(AuthorizeInjectorApiKeyMiddleware).handle],
    })
  }

  /**
   * Processes an email injection request.
   *
   * Validates the email payload, ensures the sender has permission to use
   * the specified domain, and injects the email into the sending system.
   */
  async index(ctx: HonoContext) {
    const payload = await this.validate(ctx, InjectEmailSchema)

    const sendingDomain = this.ensureCanSendFromDomain(
      ctx,
      getDomainFromEmail(payload.from.email),
    )

    const { messages } = await container
      .make(InjectEmailAction)
      .handle(payload, sendingDomain)

    return ctx.json({ messages })
  }
}
