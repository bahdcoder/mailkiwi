import { IssueSSLCertificateForWebsiteJob } from '#root/core/websites/jobs/issue_ssl_certificate_for_website_job.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'

import { DnsWebsiteResolverTool } from '#root/core/tools/dns/dns_website_resolver_tool.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export interface CheckWebsiteDomainDnsConfigurationPayload {
  websiteId: string
}

export class CheckWebsiteDomainDnsConfiguration extends BaseJob<CheckWebsiteDomainDnsConfigurationPayload> {
  static get id() {
    return 'WEBSITES::CHECK_WEBSITE_DOMAIN_DNS_CONFIGURATION'
  }

  static get queue() {
    return AVAILABLE_QUEUES.websites
  }

  async handle({ payload }: JobContext<CheckWebsiteDomainDnsConfigurationPayload>) {
    const websiteRepository = container.make(WebsiteRepository)
    const website = await websiteRepository.findById(payload.websiteId)

    if (!website) {
      return this.done(
        'The website was not found. Might have been deleted by the user before the job was run.',
      )
    }

    if (!website.websiteDomain || !website.websiteDomainCnameValue) {
      return this.done(
        'Custom website domain not configured. Might have been deleted by the user before the job was run.',
      )
    }

    const { isCnameConfiguredForDomain } = await container
      .make(DnsWebsiteResolverTool)
      .forDomain(website.websiteDomain)
      .resolveCname(website.websiteDomainCnameValue)

    if (!isCnameConfiguredForDomain) {
      await Queue.websites().add(CheckWebsiteDomainDnsConfiguration.id, payload, {
        delay: 30 * 1000, // wait 30 seconds to try again.
      })

      return this.done('Cname not configured. Queueing to retry in 30 seconds.')
    }

    await websiteRepository.updateById(website.id, {
      websiteDomainVerifiedAt: new Date(),
    })

    await Queue.websites().add(IssueSSLCertificateForWebsiteJob.id, payload)

    return this.done('Cname found, and SSL certificate issuing job scheduled.')
  }

  async failed() {}
}
