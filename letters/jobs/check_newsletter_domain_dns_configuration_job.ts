import { IssueSSLCertificateForNewsletterWebsiteJob } from "@/letters/jobs/issue_ssl_certificate_for_newsletter_website_job.js"
import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"

import { AssignSendingSourceToSendingDomainAction } from "@/sending_domains/actions/assign_sending_source_to_sending_domain_action.js"
import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { DnsResolverTool } from "@/tools/dns/dns_resolver_tool.js"
import { DnsWebsiteResolverTool } from "@/tools/dns/dns_website_resolver_tool.js"

import { newsletterWebsites, sendingDomains } from "@/database/schema.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export interface CheckNewsletterDomainDnsConfigurationPayload {
  newsletterWebsiteId: string
}

export class CheckNewsletterDomainDnsConfiguration extends BaseJob<CheckNewsletterDomainDnsConfigurationPayload> {
  static get id() {
    return "NEWSLETTER_WEBSITES::CHECK_NEWSLETTER_DOMAIN_DNS_CONFIGURATION"
  }

  static get queue() {
    return AVAILABLE_QUEUES.newsletter_websites
  }

  async handle({
    database,
    redis,
    payload,
  }: JobContext<CheckNewsletterDomainDnsConfigurationPayload>) {
    const newsletterWebsiteRepository = container.make(
      NewsletterWebsiteRepository,
    )
    const newsletterWebsite = await newsletterWebsiteRepository.findById(
      payload.newsletterWebsiteId,
    )

    if (!newsletterWebsite) {
      return this.done(
        "The newsletter website was not found. Might have been deleted by the user before the job was run.",
      )
    }

    if (
      !newsletterWebsite.websiteDomain ||
      !newsletterWebsite.websiteDomainCnameValue
    ) {
      return this.done(
        "Custom website domain not configured. Might have been deleted by the user before the job was run.",
      )
    }

    const { isCnameConfiguredForDomain } = await container
      .make(DnsWebsiteResolverTool)
      .forDomain(newsletterWebsite.websiteDomain)
      .resolveCname(newsletterWebsite.websiteDomainCnameValue)

    if (!isCnameConfiguredForDomain) {
      await Queue.newsletter_websites().add(
        CheckNewsletterDomainDnsConfiguration.id,
        payload,
        {
          delay: 30 * 1000, // wait 30 seconds to try again.
        },
      )

      return this.done(
        `Cname not configured. Queueing to retry in 30 seconds.`,
      )
    }

    await newsletterWebsiteRepository.updateById(newsletterWebsite.id, {
      websiteDomainVerifiedAt: new Date(),
    })

    await Queue.newsletter_websites().add(
      IssueSSLCertificateForNewsletterWebsiteJob.id,
      payload,
    )

    return this.done(
      "Cname found, and SSL certificate issuing job scheduled.",
    )
  }

  async failed() {}
}
