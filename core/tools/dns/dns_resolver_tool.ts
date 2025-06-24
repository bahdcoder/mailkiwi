import dns from 'node:dns/promises'
import { appEnv } from '#root/core/app/env/app_env.js'

import { DnsConfigurationTool } from '#root/core/tools/dns/dns_configuration_tool.js'

import type { SendingDomain } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class DnsResolverTool {
  private domain: string

  private dnsConfigurationTool: DnsConfigurationTool

  constructor(private env = appEnv) {}

  forDomain(domain: string) {
    this.domain = domain

    this.dnsConfigurationTool = container.make(DnsConfigurationTool).forDomain(domain)

    return this
  }

  private async resolveReturnPathCnameRecords(bounceSubdomain: string) {
    try {
      return await dns.resolveCname(`${bounceSubdomain}.${this.domain}`)
    } catch (error) {
      return [] as string[]
    }
  }

  private async resolveTrackingCnameRecords(trackingSubdomain: string) {
    try {
      return await dns.resolveCname(`${trackingSubdomain}.${this.domain}`)
    } catch (error) {
      return [] as string[]
    }
  }

  private async resolveDkimRecord(dkimSubDomain: string) {
    try {
      return await dns.resolveTxt(`${dkimSubDomain}.${this.domain}`)
    } catch (error) {
      return [] as string[]
    }
  }

  private isDkimConfigured(
    txtRecords: string[],
    publicKey: string,
    dkimSubDomain: string,
  ) {
    return txtRecords.find(
      (record) =>
        record ===
        this.dnsConfigurationTool.getRecords(publicKey, dkimSubDomain).dkim.value,
    )
  }

  private isReturnPathCnameConfigured(cnameRecords: string[]) {
    return cnameRecords.some((record) => record === this.env.software.bounceHost)
  }

  private isTrackingCnameConfigured(cnameRecords: string[]) {
    return cnameRecords.some((record) => record === this.env.software.trackingHostName)
  }
  async resolve(sendingDomain: SendingDomain) {
    let [returnPathCnameRecords, dkimTxtRecords, trackingCnameRecords] =
      await Promise.all([
        this.resolveReturnPathCnameRecords(sendingDomain.returnPathSubDomain),
        this.resolveDkimRecord(sendingDomain.dkimSubDomain),
        this.resolveTrackingCnameRecords(sendingDomain.trackingSubDomain),
      ])

    dkimTxtRecords = dkimTxtRecords.map((record) =>
      Array.isArray(record) ? record.join('') : record,
    ) as string[]

    return {
      returnPathCnameRecords,
      trackingCnameRecords,
      dmarcConfigured: false,
      trackingCnameConfigured: this.isTrackingCnameConfigured(trackingCnameRecords),

      returnPathCnameConfigured: this.isReturnPathCnameConfigured(returnPathCnameRecords),
      dkimConfigured: this.isDkimConfigured(
        dkimTxtRecords,
        sendingDomain.dkimPublicKey,
        sendingDomain.dkimSubDomain,
      ),
      returnPathConfigured: returnPathCnameRecords.includes(this.env.software.bounceHost),
    }
  }
}
