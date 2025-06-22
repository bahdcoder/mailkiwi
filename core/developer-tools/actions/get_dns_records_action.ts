import { DeveloperToolsRepository } from '#root/core/developer-tools/repositories/developer_tools_repository.js'
import { container } from '#root/core/utils/typi.js'

export class GetDnsRecordsAction {
  constructor(
    private developerToolsRepository = container.make(DeveloperToolsRepository),
  ) {}

  async handle(domainId?: string) {
    if (domainId) {
      // Get records for a specific domain
      const records =
        await this.developerToolsRepository.findDomainRecordsByDomainId(domainId)
      return records.map((record) => ({
        id: record.id,
        domainId: record.developerTools__domainsId,
        recordType: record.recordType,
        recordName: record.recordName,
        recordValue: record.recordValue,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }))
    }

    // Get all domains with their records
    const domains = await this.developerToolsRepository.findDomainsWithRecords()
    const allRecords = domains.flatMap((domain) =>
      domain.domainRecords.map((record) => ({
        id: record.id,
        domainId: record.developerTools__domainsId,
        domainName: `${domain.subdomain}.${domain.domain}`,
        recordType: record.recordType,
        recordName: record.recordName,
        recordValue: record.recordValue,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
    )
    return allRecords
  }
}
