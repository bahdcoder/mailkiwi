import { AssignSendingSourceToSendingDomainAction } from '#root/core/sending_domains/actions/assign_sending_source_to_sending_domain_action.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { DnsResolverTool } from '#root/core/tools/dns/dns_resolver_tool.js'

import { sendingDomains } from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export interface CheckSendingDomainDnsConfigurationJobPayload {
  sendingDomainId: string
}

export class CheckSendingDomainDnsConfigurationJob extends BaseJob<CheckSendingDomainDnsConfigurationJobPayload> {
  static get id() {
    return 'SENDING_DOMAINS::CHECK_SENDING_DOMAIN_DNS_CONFIGURATION'
  }

  static get queue() {
    return AVAILABLE_QUEUES.sending_domains
  }

  async handle({
    database,
    redis,
    payload,
  }: JobContext<CheckSendingDomainDnsConfigurationJobPayload>) {
    const sendingDomainRepository = container.make(SendingDomainRepository)
    const sendingDomain = await sendingDomainRepository.findById(payload.sendingDomainId)

    if (!sendingDomain) {
      return this.done(
        'The sending domain was not found. Might have been deleted by the user before the job was run.',
      )
    }

    const { returnPathCnameConfigured, dkimConfigured, trackingCnameConfigured } =
      await container
        .make(DnsResolverTool)
        .forDomain(sendingDomain.name)
        .resolve(sendingDomain)

    const databaseCalls = []

    if (dkimConfigured) {
      databaseCalls.push(
        database.update(sendingDomains).set({
          dkimVerifiedAt: new Date(),
        }),
      )
    }

    if (returnPathCnameConfigured) {
      databaseCalls.push(
        database.update(sendingDomains).set({
          returnPathDomainVerifiedAt: new Date(),
        }),
      )
    }

    if (trackingCnameConfigured) {
      databaseCalls.push(
        database.update(sendingDomains).set({
          trackingDomainVerifiedAt: new Date(),
        }),
      )
    }

    // todo: if tracking cname configured, trigger DeploySslCertificateForTrackingDomainJob.

    await Promise.all(databaseCalls)

    if (returnPathCnameConfigured && dkimConfigured) {
      await container
        .make(AssignSendingSourceToSendingDomainAction)
        .handle(sendingDomain.id)

      await sendingDomainRepository.getDomainWithDkim(sendingDomain.name, true)
    }

    if (!returnPathCnameConfigured || !dkimConfigured || !trackingCnameConfigured) {
      await Queue.sending_domains().add(
        CheckSendingDomainDnsConfigurationJob.id,
        payload,
        {
          delay: 30 * 1000, // wait 30 seconds to try again.
          attempts: 100, // keep attempting for as long as needed, for now.
        },
      )
    }

    return this.done()
  }

  async failed() {}
}
