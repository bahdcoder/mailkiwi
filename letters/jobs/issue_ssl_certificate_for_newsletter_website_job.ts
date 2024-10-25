import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

import { container } from "@/utils/typi.js"

export interface IssueSSLCertificateForNewsletterWebsiteJobPayload {
  newsletterWebsiteId: string
}

export class IssueSSLCertificateForNewsletterWebsiteJob extends BaseJob<IssueSSLCertificateForNewsletterWebsiteJobPayload> {
  static get id() {
    return "NEWSLETTER_WEBSITES::ISSUE_SSL_CERTIFICATES_FOR_NEWSLETTER_WEBSITE"
  }

  static get queue() {
    return AVAILABLE_QUEUES.newsletter_websites
  }

  async handle({
    payload,
  }: JobContext<IssueSSLCertificateForNewsletterWebsiteJobPayload>) {
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
      !newsletterWebsite.websiteDomainCnameValue ||
      !newsletterWebsite.websiteDomainVerifiedAt
    ) {
      return this.done(
        "Custom website domain not configured. Might have been deleted by the user before the job was run.",
      )
    }

    return this.done()
  }

  async failed() {}
}
