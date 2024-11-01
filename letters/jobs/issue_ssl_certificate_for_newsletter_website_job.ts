import { appEnv } from "@/app/env/app_env.js"
import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"
import { SettingRepository } from "@/settings/repositories/setting_repository.js"
import { DateTime } from "luxon"

import { AcmeCertificatesTool } from "@/tools/ssl/acme_certificates_tool.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

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
      !newsletterWebsite.websiteDomainCnameValue
    ) {
      return this.done(
        "Custom website domain not configured. Might have been deleted by the user before the job was run.",
      )
    }

    const settings = await container.make(SettingRepository).get()

    const acmeCertificatesTool = container.make(AcmeCertificatesTool)

    acmeCertificatesTool
      .setAccountKey(settings.acmeAccountIdentity)
      .forDomain(newsletterWebsite.websiteDomain)

    const [certificatePrivateKey, csr] = await acmeCertificatesTool
      .setAccountKey(settings.acmeAccountIdentity)
      .forDomain(newsletterWebsite.websiteDomain)
      .csr()

    const acmeClient = acmeCertificatesTool.client()

    await acmeClient.createAccount({
      termsOfServiceAgreed: true,
      contact: acmeCertificatesTool.CERTIFICATES_CONTACT,
    })

    const certificatePublicKey = await acmeClient.auto({
      csr,
      termsOfServiceAgreed: true,
      skipChallengeVerification: true,
      email: acmeCertificatesTool.CERTIFICATES_CONTACT_EMAIL,
      async challengeCreateFn(authz, challenge, keyAuthorization) {
        await newsletterWebsiteRepository.updateById(
          newsletterWebsite.id,
          {
            websiteSslCertChallengeToken: challenge.token,
            websiteSslCertChallengeKeyAuthorization: keyAuthorization,
          },
        )
      },
      async challengeRemoveFn(authz, challenge, keyAuthorization) {},
    })

    await newsletterWebsiteRepository.updateById(newsletterWebsite.id, {
      websiteSslCertKey: certificatePublicKey,
      websiteSslCertSecret: certificatePrivateKey.toString("utf-8"),
      websiteDomainSslVerifiedAt: DateTime.now().toJSDate(),
    })

    // TODO: Add the certificate key pair to the web server for SSL encrypted requests.

    return this.done()
  }

  async failed() {}
}
