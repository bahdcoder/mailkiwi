import { SettingRepository } from '#root/core/settings/repositories/setting_repository.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'
import { DateTime } from 'luxon'

import { AcmeCertificatesTool } from '#root/core/tools/ssl/acme_certificates_tool.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

import { container } from '#root/core/utils/typi.js'

export interface IssueSSLCertificateForWebsiteJobPayload {
  websiteId: string
}

export class IssueSSLCertificateForWebsiteJob extends BaseJob<IssueSSLCertificateForWebsiteJobPayload> {
  static get id() {
    return 'WEBSITES::ISSUE_SSL_CERTIFICATES_FOR_WEBSITE'
  }

  static get queue() {
    return AVAILABLE_QUEUES.websites
  }

  async handle({ payload }: JobContext<IssueSSLCertificateForWebsiteJobPayload>) {
    const websiteRepository = container.make(WebsiteRepository)
    const website = await websiteRepository.findById(payload.websiteId)

    if (!website) {
      return this.done(
        'The newsletter website was not found. Might have been deleted by the user before the job was run.',
      )
    }

    if (!website.websiteDomain || !website.websiteDomainCnameValue) {
      return this.done(
        'Custom website domain not configured. Might have been deleted by the user before the job was run.',
      )
    }

    const settings = await container.make(SettingRepository).get()

    const acmeCertificatesTool = container.make(AcmeCertificatesTool)

    acmeCertificatesTool
      .setAccountKey(settings.acmeAccountIdentity)
      .forDomain(website.websiteDomain)

    const [certificatePrivateKey, csr] = await acmeCertificatesTool
      .setAccountKey(settings.acmeAccountIdentity)
      .forDomain(website.websiteDomain)
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
        await websiteRepository.updateById(website.id, {
          websiteSslCertChallengeToken: challenge.token,
          websiteSslCertChallengeKeyAuthorization: keyAuthorization,
        })
      },
      async challengeRemoveFn(authz, challenge, keyAuthorization) {},
    })

    await websiteRepository.updateById(website.id, {
      websiteSslCertKey: certificatePublicKey,
      websiteSslCertSecret: certificatePrivateKey.toString('utf-8'),
      websiteDomainSslVerifiedAt: DateTime.now().toJSDate(),
    })

    // TODO: Add the certificate key pair to the web server for SSL encrypted requests.

    return this.done()
  }

  async failed() {}
}
