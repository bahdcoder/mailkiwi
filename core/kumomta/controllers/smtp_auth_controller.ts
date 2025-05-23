import { AuthorizeInjectorApiKeyMiddleware } from '#root/core/injector/middleware/authorize_injector_api_key_middleware.js'
import { AuthorizeMtaCallsMiddleware } from '#root/core/kumomta/middleware/authorize_mta_calls_middleware.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * SmtpAuthController handles SMTP authentication for email sending.
 *
 * This controller is responsible for:
 * 1. Validating SMTP credentials during email sending attempts
 * 2. Providing authentication services for the mail transfer agent (MTA)
 * 3. Securing the email sending infrastructure against unauthorized use
 *
 * The controller works with the MTA to ensure that only authorized users
 * and applications can send emails through the Kibamail platform, which
 * is essential for maintaining sending reputation and preventing abuse.
 */
export class SmtpAuthController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/mta/smtp/auth', this.index.bind(this)]], {
      prefix: '/',
      middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
    })
  }

  /**
   * Validates SMTP credentials for email sending.
   *
   * Verifies the provided username and password against stored credentials
   * and returns a success or failure response to the mail server.
   */
  async index(ctx: HonoContext) {
    const { username, passwd } = await ctx.req.json<{
      username: string
      passwd: string
    }>()

    try {
      await container
        .make(AuthorizeInjectorApiKeyMiddleware)
        .verifySmtpCredentials(username, passwd)

      return ctx.json({ status: 'success' })
    } catch (error) {
      return ctx.json({ status: 'failed' }, 400)
    }
  }
}
