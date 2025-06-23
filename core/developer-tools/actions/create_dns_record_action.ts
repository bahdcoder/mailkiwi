import type { CreateDnsRecordDto } from '#root/core/developer-tools/dtos/create_dns_record_dto.js'

export class CreateDnsRecordAction {
  async handle(_payload: CreateDnsRecordDto) {
    return {
      id: '',
      domainId: '',
      recordType: '',
      recordName: '',
      recordValue: '',
      createdAt: new Date(),
    }
  }
}
