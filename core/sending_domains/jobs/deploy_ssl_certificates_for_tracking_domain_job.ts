import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface DeploySslCertificateForTrackingDomainJobPayload {
  sendingDomainId: string
}

export class DeploySslCertificateForTrackingDomainJob extends BaseJob<DeploySslCertificateForTrackingDomainJobPayload> {
  static get id() {
    return 'SENDING_DOMAINS::DEPLOY_SSL_CERTIFICATE_FOR_TRACKING_DOMAIN'
  }

  static get queue() {
    return AVAILABLE_QUEUES.sending_domains
  }

  async handle({ payload }: JobContext<DeploySslCertificateForTrackingDomainJobPayload>) {
    const sendingDomainRepository = container.make(SendingDomainRepository)
    const sendingDomain = await sendingDomainRepository.findById(payload.sendingDomainId)

    if (!sendingDomain) {
      return this.done(
        'The sending domain was not found. Might have been deleted by the user before the job was run.',
      )
    }

    return this.done()
  }

  async failed() {}
}
