import { CreateSubdomainAction } from '#root/core/developer-tools/actions/create_subdomain_action.js'
import { CreateDnsRecordAction } from '#root/core/developer-tools/actions/create_dns_record_action.js'
import { GetSubdomainsAction } from '#root/core/developer-tools/actions/get_subdomains_action.js'
import { GetDnsRecordsAction } from '#root/core/developer-tools/actions/get_dns_records_action.js'
import { CreateSubdomainSchema } from '#root/core/developer-tools/dtos/create_subdomain_dto.js'
import { CreateDnsRecordSchema } from '#root/core/developer-tools/dtos/create_dns_record_dto.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import type { HonoInstance } from '#root/core/shared/server/hono.js'
import { container } from '#root/core/utils/typi.js'

/**
 * DNS Controller - Manages DNS-related developer tools functionality.
 *
 * This controller handles:
 * - Subdomain generation and management
 * - DNS record creation and retrieval
 * - Domain configuration for development/testing
 */
export class DnsController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/generate-subdomain', this.generateSubdomain.bind(this)],
        ['GET', '/subdomains', this.getSubdomains.bind(this)],

        ['POST', '/configure-dns-records', this.configureDnsRecords.bind(this)],
        ['GET', '/dns-records', this.getDnsRecords.bind(this)],
        ['GET', '/domains/:domainId/dns-records', this.getDnsRecordsForDomain.bind(this)],
      ],
      {
        prefix: 'developer-tools/dns',
      },
    )
  }

  /**
   * Generates a new subdomain for development/testing purposes.
   *
   * Creates a subdomain with the specified prefix on the selected domain
   * (kibamail.xyz or kibamail.online).
   */
  async generateSubdomain(ctx: HonoContext) {
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateSubdomainSchema)

    const subdomain = await container.resolve(CreateSubdomainAction).handle(data)

    return this.response(ctx).json(subdomain, 201).send()
  }

  /**
   * Retrieves all subdomains for the current team.
   *
   * Returns a list of all generated subdomains with their associated
   * DNS records count and metadata.
   */
  async getSubdomains(ctx: HonoContext) {
    this.ensureCanView(ctx)

    const subdomains = await container.resolve(GetSubdomainsAction).handle()

    return ctx.json(subdomains)
  }

  /**
   * Configures DNS records for a domain.
   *
   * Creates DNS records (A, CNAME, TXT, etc.) for existing domains
   * managed through the developer tools.
   */
  async configureDnsRecords(ctx: HonoContext) {
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateDnsRecordSchema)

    const record = await container.resolve(CreateDnsRecordAction).handle(data)

    return this.response(ctx).json(record, 201).send()
  }

  /**
   * Retrieves all DNS records for the current team.
   *
   * Returns all DNS records across all domains managed by the team.
   */
  async getDnsRecords(ctx: HonoContext) {
    this.ensureCanView(ctx)

    const records = await container.resolve(GetDnsRecordsAction).handle()

    return ctx.json(records)
  }

  /**
   * Retrieves DNS records for a specific domain.
   *
   * Returns all DNS records associated with the specified domain ID.
   */
  async getDnsRecordsForDomain(ctx: HonoContext) {
    this.ensureCanView(ctx)

    const domainId = ctx.req.param('domainId')
    const records = await container.resolve(GetDnsRecordsAction).handle(domainId)

    return ctx.json(records)
  }
}
