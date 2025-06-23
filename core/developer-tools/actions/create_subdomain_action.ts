import { appEnv } from '#root/core/app/env/app_env'
import type { CreateSubdomainDto } from '#root/core/developer-tools/dtos/create_subdomain_dto.js'
import { container } from '#root/core/utils/typi'
import { $trycatch } from '@tszen/trycatch'
import { NamecheapApiTool, type NewDomainRecord } from '../tools/namecheap_api_tool.js'
import { nanoid } from 'nanoid'

export class CreateSubdomainAction {
  async handle(payload: CreateSubdomainDto) {
    const subdomain = `${payload.subdomainPrefix}-${nanoid(6).toLowerCase()}`

    const returnPathRecords = {
      name: `${appEnv.software.bounceSubdomain}.${subdomain}`,
      type: 'CNAME',
      address: appEnv.software.bounceHost,
      ttl: 60,
    } satisfies NewDomainRecord

    const trackingRecords = {
      name: `${appEnv.software.trackingSubdomain}.${subdomain}`,
      type: 'CNAME',
      address: appEnv.software.trackingHostName,
      ttl: 60,
    } satisfies NewDomainRecord

    return $trycatch(() =>
      container
        .make(NamecheapApiTool)
        .setDomainHosts(payload.domain, [returnPathRecords, trackingRecords]),
    )
  }
}
