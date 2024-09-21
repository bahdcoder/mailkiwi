import { eq } from "drizzle-orm"
import { resolveCname, resolveTxt } from "node:dns/promises"

import { DnsResolverTool } from "@/tools/dns/dns_resolver_tool.js"

import { sendingDomains } from "@/database/schema/schema.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export interface CheckSendingDomainDnsConfigurationJobPayload {
  sendingDomainId: string
}

export class CheckSendingDomainDnsConfigurationJob extends BaseJob<CheckSendingDomainDnsConfigurationJobPayload> {
  static get id() {
    return "SENDING_DOMAINS::CHECK_SENDING_DOMAIN_DNS_CONFIGURATION"
  }

  static get queue() {
    return AVAILABLE_QUEUES.sending_domains
  }

  async handle({
    database,
    redis,
    payload,
  }: JobContext<CheckSendingDomainDnsConfigurationJobPayload>) {
    const sendingDomain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.id, payload.sendingDomainId),
    })

    if (!sendingDomain) {
      return this.fail()
    }

    const { cnameConfigured, dkimConfigured } = await container
      .make(DnsResolverTool)
      .forDomain(sendingDomain.name)
      .resolve(sendingDomain.dkimPublicKey, sendingDomain.dkimSubDomain)

    const databaseCalls = []

    if (dkimConfigured) {
      databaseCalls.push(
        database.update(sendingDomains).set({
          dkimVerifiedAt: new Date(),
        }),
      )
    }

    if (cnameConfigured) {
      databaseCalls.push(
        database.update(sendingDomains).set({
          returnPathDomainVerifiedAt: new Date(),
        }),
      )
    }

    await Promise.all(databaseCalls)

    if (!cnameConfigured || !dkimConfigured) {
      await Queue.sending_domains().add(
        CheckSendingDomainDnsConfigurationJob.id,
        payload,
        {
          delay: 30 * 1000, // wait 30 seconds to try again.
        },
      )
    }

    return this.done()
  }

  async failed() {}
}
