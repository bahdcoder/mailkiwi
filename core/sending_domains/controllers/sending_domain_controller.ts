import { CreateSendingDomainAction } from '@/sending_domains/actions/create_sending_domain_action.js'
import { CreateSendingDomainSchema } from '@/sending_domains/dto/create_sending_domain_dto.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

/**
 * SendingDomainController manages domain verification for email sending.
 *
 * This controller is responsible for:
 * 1. Creating and registering sending domains for email campaigns
 * 2. Managing domain verification status and DNS records
 * 3. Enforcing team-based access control for domain resources
 *
 * Sending domains are critical for email deliverability, as they establish
 * the infrastructure needed for proper email authentication (SPF, DKIM, DMARC)
 * and tracking capabilities.
 */
export class SendingDomainController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/', this.store.bind(this)]], {
      prefix: 'sending_domains',
    })
  }

  /**
   * Lists sending domains for the team.
   *
   * Currently returns an empty array as implementation is pending.
   */
  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  /**
   * Creates a new sending domain.
   *
   * Registers a domain for email sending and generates the necessary
   * DNS records for proper authentication and tracking setup.
   */
  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateSendingDomainSchema)

    const team = this.ensureTeam(ctx)

    const sendingDomain = await container
      .make(CreateSendingDomainAction)
      .handle(data, team.id)

    return ctx.json(sendingDomain)
  }
}
