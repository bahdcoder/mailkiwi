export class DnsConfigurationTool {
  private domain: string
  private encryptionAlgorithm = 'rsa'

  forDomain(domain: string) {
    this.domain = domain
    return this
  }

  private cleanupPublicKey(publicKey: string) {
    const lines = publicKey.split('\n')

    lines.shift()
    lines.pop()
    lines.pop()

    return lines.join('')
  }

  private dkimRecordValue(publicKey: string, dkimSubDomain: string) {
    return {
      hostname: `${dkimSubDomain}.${this.domain}`,
      value: `k=${this.encryptionAlgorithm};p=${this.cleanupPublicKey(publicKey)}`,
    }
  }

  getRecords(publicKey: string, dkimSubDomain: string) {
    return {
      dkim: this.dkimRecordValue(publicKey, dkimSubDomain),
    }
  }
}
