import type { CreateDnsRecordDto } from '#root/core/developer-tools/dtos/create_dns_record_dto.js'
import { container } from '#root/core/utils/typi'
import { $trycatch } from '@tszen/trycatch'
import { NamecheapApiTool, type NewDomainRecord } from '../tools/namecheap_api_tool.js'

export class CreateDnsRecordAction {
  async handle(payload: CreateDnsRecordDto) {
    const dnsRecord = {
      name: payload.recordName,
      type: payload.recordType,
      address: payload.recordValue,
      ttl: Number.parseInt(payload.ttl, 10),
    } satisfies NewDomainRecord

    return $trycatch(() =>
      container.make(NamecheapApiTool).setDomainHosts(payload.domain, [dnsRecord]),
    )
  }
}
