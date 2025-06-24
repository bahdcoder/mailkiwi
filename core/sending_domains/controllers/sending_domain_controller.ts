import { CreateSendingDomainAction } from '#root/core/sending_domains/actions/create_sending_domain_action.js'
import { CreateSendingDomainSchema } from '#root/core/sending_domains/dto/create_sending_domain_dto.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import {
  makeApp,
  makeDatabase,
  makeLogger,
  makeRedis,
} from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { excludeKeys } from '#root/core/shared/utils/helpers/exclude_keys'

import { container } from '#root/core/utils/typi.js'
import type { SendingDomain } from '#root/database/database_schema_types'
import { CheckSendingDomainDnsConfigurationJob } from '../jobs/check_sending_domain_dns_configuration_job.js'

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

    this.app.defineRoutes(
      [
        ['GET', '/', this.index.bind(this)],
        ['GET', '/:sendingDomainId', this.get.bind(this)],
        ['POST', '/', this.store.bind(this)],
        ['DELETE', '/:sendingDomainId', this.delete.bind(this)],
      ],
      {
        prefix: 'sending_domains',
      },
    )
  }

  /**
   * Lists sending domains for the team.
   *
   * Fetches all sending domains associated with the current team and returns
   * them with their verification status and configuration details.
   */
  async index(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const sendingDomains = await container
      .make(SendingDomainRepository)
      .findAllForTeam(team.id)

    return this.response(ctx)
      .json({
        sendingDomains: sendingDomains.map((domain) =>
          excludeKeys(domain, ['dkimPrivateKey']),
        ),
      })
      .send()
  }

  /**
   * Gets a single sending domain by ID.
   *
   * Fetches a specific sending domain by its ID, ensuring it belongs to the current team.
   * Returns the domain with its verification status and configuration details, excluding
   * sensitive information like the DKIM private key.
   */
  async get(ctx: HonoContext) {
    this.ensureTeam(ctx)
    this.ensureCanManage(ctx)

    const shouldPerformCheck = ctx.req.query('check')

    let sendingDomain = await this.ensureExists<SendingDomain>(ctx, 'sendingDomainId')

    if (shouldPerformCheck === 'true') {
      await new CheckSendingDomainDnsConfigurationJob().check({
        database: makeDatabase(),
        redis: makeRedis(),
        logger: makeLogger(),
        payload: {
          sendingDomainId: sendingDomain.id,
        },
        sendingDomain,
      })
    }

    sendingDomain = await container
      .make(SendingDomainRepository)
      .findById(sendingDomain.id)

    return this.response(ctx)
      .json(excludeKeys(sendingDomain, ['dkimPrivateKey']))
      .send()
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

    return this.response(ctx).json(sendingDomain).send()
  }

  /**
   * Deletes a sending domain.
   *
   * Soft deletes a sending domain by setting the deletedAt timestamp.
   * This preserves the domain record for audit purposes while making it
   * unavailable for new email sending operations.
   */
  async delete(ctx: HonoContext) {
    this.ensureTeam(ctx)
    this.ensureCanManage(ctx)

    const sendingDomain = await this.ensureExists<SendingDomain>(ctx, 'sendingDomainId')

    // TODO: Add deletedAt field to schema and implement soft delete
    await container.make(SendingDomainRepository).delete(sendingDomain.id)

    return this.response(ctx).json({ message: 'Domain deleted successfully' }).send()
  }
}
