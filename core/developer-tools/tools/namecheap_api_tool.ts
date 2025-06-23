import { appEnv } from '#root/core/app/env/app_env'
import namecheapApi from 'namecheap-api'

type DomainHost = {
  Address: string
  AssociatedAppTitle: string
  FriendlyName: string
  HostId: string
  IsActive: 'true' | 'false'
  IsDDNSEnabled: string
  MXPref: string
  Name: string
  TTL: string
  Type: string
}

export type NewDomainRecord = {
  name: string
  type: string
  address: string
  ttl?: number
  mxPref?: number
}

type ApiHostParam = Record<string, string>

export class NamecheapApiTool {
  protected namecheap: typeof namecheapApi

  constructor() {
    this.namecheap = namecheapApi

    this.namecheap.config.set('ApiUser', appEnv.NAMECHEAP_API_USERNAME)
    this.namecheap.config.set('ApiKey', appEnv.NAMECHEAP_API_KEY)
    this.namecheap.config.set('UserName', appEnv.NAMECHEAP_API_USERNAME)
    this.namecheap.config.set('ClientIp', appEnv.NAMECHEAP_API_IP_ADDRESS)
  }

  async getAllDomains() {
    const list = await this.namecheap.apiCall<
      {
        DomainGetListResult: {
          Domain: {
            $: {
              AutoRenew: boolean
              Created: string
              Expires: string
              ID: string
              IsExpired: boolean
              IsLocked: boolean
              IsOurDNS: 'yes' | 'no'
              IsPremium: boolean
              Name: string
              User: string
              WhoisGuard: 'ENABLED' | 'DISABLED'
            }
          }[]
        }[]
      }[]
    >('namecheap.domains.getList', {})

    return list.response?.[0]?.DomainGetListResult?.[0]?.Domain?.map(({ $ }) => $) || []
  }

  async getDomainHosts(domain: string) {
    const [SLD, TLD] = domain.split('.')
    const hosts = await this.namecheap.apiCall<
      {
        DomainDNSGetHostsResult: {
          host: {
            $: {
              Address: string
              AssociatedAppTitle: string
              FriendlyName: string
              HostId: string
              IsActive: 'true' | 'false'
              IsDDNSEnabled: string
              MXPref: string
              Name: string
              TTL: string
              Type: string
            }
          }[]
        }[]
      }[]
    >('namecheap.domains.dns.getHosts', {
      SLD,
      TLD,
    })

    return (
      hosts?.response?.[0]?.DomainDNSGetHostsResult?.[0]?.host?.map(({ $ }) => $) || []
    )
  }

  async setDomainHosts(domain: string, newRecords: NewDomainRecord[]) {
    const [SLD, TLD] = domain.split('.')
    const existingHosts = await this.getDomainHosts(domain)
    const allHosts = this.combineExistingAndNewHosts(existingHosts, newRecords)
    const hostParams = this.flattenHostsToApiParams(allHosts)

    const result = await this.namecheap.apiCall<
      {
        DomainDNSSetHostsResult: {
          $: {
            Domain: string
            IsSuccess: 'true' | 'false'
          }
        }[]
      }[]
    >('namecheap.domains.dns.setHosts', {
      SLD,
      TLD,
      ...hostParams,
    })

    return result?.response?.[0]?.DomainDNSSetHostsResult?.[0]?.$
  }

  private combineExistingAndNewHosts(
    existingHosts: DomainHost[],
    newRecords: NewDomainRecord[],
  ) {
    const existingHostParams = existingHosts.map((host, index) =>
      this.formatExistingHostForApi(host, index + 1),
    )

    const newHostParams = newRecords.map((record, index) =>
      this.formatNewRecordForApi(record, existingHosts.length + index + 1),
    )

    return [...existingHostParams, ...newHostParams]
  }

  private formatExistingHostForApi(host: DomainHost, hostIndex: number): ApiHostParam {
    const params: ApiHostParam = {
      [`HostName${hostIndex}`]: host.Name,
      [`RecordType${hostIndex}`]: host.Type,
      [`Address${hostIndex}`]: host.Address,
      [`TTL${hostIndex}`]: host.TTL,
    }

    if (host.MXPref) {
      params[`MXPref${hostIndex}`] = host.MXPref
    }

    return params
  }

  private formatNewRecordForApi(
    record: NewDomainRecord,
    hostIndex: number,
  ): ApiHostParam {
    const params: ApiHostParam = {
      [`HostName${hostIndex}`]: record.name,
      [`RecordType${hostIndex}`]: record.type,
      [`Address${hostIndex}`]: record.address,
      [`TTL${hostIndex}`]: record.ttl?.toString() || '1800',
    }

    if (record.mxPref) {
      params[`MXPref${hostIndex}`] = record.mxPref.toString()
    }

    return params
  }

  private flattenHostsToApiParams(allHosts: ApiHostParam[]): Record<string, string> {
    return allHosts.reduce((acc, host) => {
      return Object.assign(acc, host)
    }, {})
  }
}
