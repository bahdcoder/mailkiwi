import type {
  SetDomainHostsDto,
  DomainHostRecord,
} from '#root/core/developer-tools/dtos/set_domain_hosts_dto.js'
import { DeveloperToolsRepository } from '#root/core/developer-tools/repositories/developer_tools_repository.js'
import { NamecheapApiTool } from '#root/core/developer-tools/tools/namecheap_api_tool.js'
import { container } from '#root/core/utils/typi.js'

type DomainEntity = {
  id: string
  subdomain: string
  domain: string
}

type ApiResponse = {
  Domain: string
  IsSuccess: 'true' | 'false'
}

type DatabaseRecord = {
  id: string
  developerTools__domainsId: string
  recordType: string
  recordName: string
  recordValue: string
  createdAt: Date
}

type FormattedRecord = {
  id: string
  domainId: string
  recordType: string
  recordName: string
  recordValue: string
  createdAt: Date
}

export class SetDomainHostsAction {
  constructor(
    private developerToolsRepository = container.make(DeveloperToolsRepository),
    private namecheapApiTool = new NamecheapApiTool(),
  ) {}

  async handle(payload: SetDomainHostsDto) {
    const domain = await this.validateDomainExists(payload.domain)
    const result = await this.updateDomainHostsViaApi(payload.domain, payload.records)
    this.validateApiResponse(result, payload.domain)
    const createdRecords = await this.storeRecordsInDatabase(domain.id, payload.records)

    return this.buildSuccessResponse(payload.domain, createdRecords, result)
  }

  private async validateDomainExists(domainName: string): Promise<DomainEntity> {
    const domains = await this.developerToolsRepository.findAllDomains()
    const domain = domains.find((d) => `${d.subdomain}.${d.domain}` === domainName)

    if (!domain) {
      throw new Error(
        `Domain ${domainName} not found. Please create the subdomain first.`,
      )
    }

    return domain
  }

  private async updateDomainHostsViaApi(
    domainName: string,
    records: DomainHostRecord[],
  ): Promise<ApiResponse | undefined> {
    return await this.namecheapApiTool.setDomainHosts(domainName, records)
  }

  private validateApiResponse(result: ApiResponse | undefined, domainName: string): void {
    if (result?.IsSuccess !== 'true') {
      throw new Error(`Failed to set domain hosts for ${domainName}`)
    }
  }

  private async storeRecordsInDatabase(
    domainId: string,
    records: DomainHostRecord[],
  ): Promise<FormattedRecord[]> {
    const createdRecords: FormattedRecord[] = []

    for (const record of records) {
      const dbRecord = await this.developerToolsRepository.createDomainRecord({
        developerTools__domainsId: domainId,
        recordType: record.type,
        recordName: record.name,
        recordValue: record.address,
      })

      createdRecords.push(this.formatDatabaseRecord(dbRecord))
    }

    return createdRecords
  }

  private formatDatabaseRecord(dbRecord: DatabaseRecord): FormattedRecord {
    return {
      id: dbRecord.id,
      domainId: dbRecord.developerTools__domainsId,
      recordType: dbRecord.recordType,
      recordName: dbRecord.recordName,
      recordValue: dbRecord.recordValue,
      createdAt: dbRecord.createdAt,
    }
  }

  private buildSuccessResponse(
    domainName: string,
    createdRecords: FormattedRecord[],
    namecheapResult: ApiResponse | undefined,
  ) {
    return {
      success: true,
      domain: domainName,
      recordsCreated: createdRecords.length,
      records: createdRecords,
      namecheapResult,
    }
  }
}
