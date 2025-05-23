import { appEnv } from '#root/core/app/env/app_env.js'
import { AuthorizeMtaCallsMiddleware } from '#root/core/kumomta/middleware/authorize_mta_calls_middleware.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { makeApp, makeRedis } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

import { container } from '#root/core/utils/typi.js'

/**
 * DkimController provides DKIM (DomainKeys Identified Mail) information for email authentication.
 *
 * This controller is responsible for:
 * 1. Retrieving DKIM configuration for a specific domain
 * 2. Providing the necessary cryptographic keys and subdomain information
 * 3. Supporting the email sending infrastructure with proper authentication data
 *
 * DKIM is a critical email authentication method that helps prevent email spoofing
 * by allowing receiving mail servers to verify that messages were authorized by
 * the domain owner and weren't altered in transit.
 */
export class DkimController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/mta/dkim/', this.index.bind(this)]], {
      prefix: '/',
      middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
    })
  }

  /**
   * Retrieves DKIM configuration for a specified domain.
   *
   * Returns the private key and subdomain information needed for
   * properly signing outgoing emails with DKIM authentication.
   */
  async index(ctx: HonoContext) {
    const { domain } = await ctx.req.json<{ domain: string }>()

    const sendingSource = await container
      .make(SendingDomainRepository)
      .getDomainWithDkim(domain)

    if (!sendingSource) return ctx.json({ status: 'failed' })

    const { domain: domainDkim, send, engage } = sendingSource

    const privateKey = new Encryption(appEnv.APP_KEY).decrypt(domainDkim.dkimPrivateKey)

    const { returnPathSubDomain, dkimSubDomain } = domainDkim

    return ctx.json({
      status: 'success',
      returnPathSubDomain,
      dkimSubDomain,
      privateKey: privateKey?.release(),
      send,
      engage,
    })
  }
}
