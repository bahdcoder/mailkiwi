import type { CreateDnsRecordDto } from '#root/core/developer-tools/dtos/create_dns_record_dto.js'
import { DeveloperToolsRepository } from '#root/core/developer-tools/repositories/developer_tools_repository.js'
import { container } from '#root/core/utils/typi.js'

export class CreateDnsRecordAction {
  constructor(
    private developerToolsRepository = container.make(DeveloperToolsRepository),
  ) {}

  async handle(payload: CreateDnsRecordDto) {
    const domains = await this.developerToolsRepository.findAllDomains()

    const domain = domains.find((d) => `${d.subdomain}.${d.domain}` === payload.domain)

    if (!domain) {
      // If domain doesn't exist, we could either create it or throw an error
      // For now, let's throw an error since DNS records should be for existing domains
      throw new Error(
        `Domain ${payload.domain} not found. Please create the subdomain first.`,
      )
    }

    const record = await this.developerToolsRepository.createDomainRecord({
      developerTools__domainsId: domain.id,
      recordType: payload.recordType,
      recordName: payload.recordName,
      recordValue: payload.recordValue,
    })

    return {
      id: record.id,
      domainId: record.developerTools__domainsId,
      recordType: record.recordType,
      recordName: record.recordName,
      recordValue: record.recordValue,
      createdAt: record.createdAt,
    }
  }
}
