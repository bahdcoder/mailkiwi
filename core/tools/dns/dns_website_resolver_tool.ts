import dns from 'node:dns/promises'

export class DnsWebsiteResolverTool {
  private domain: string

  forDomain(domain: string) {
    this.domain = domain

    return this
  }

  private async resolveCnameRecordsForDomain(domain: string) {
    try {
      return await dns.resolveCname(domain)
    } catch (error) {
      return [] as string[]
    }
  }

  async resolveCname(cnameValue: string) {
    const records = await this.resolveCnameRecordsForDomain(cnameValue)

    const isCnameConfiguredForDomain =
      records.find((record) => record === this.domain) !== undefined

    return {
      isCnameConfiguredForDomain,
    }
  }
}
