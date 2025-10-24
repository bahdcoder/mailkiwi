declare module 'namecheap-api' {
  interface NamecheapApiResponse<T = unknown> {
    requestPayload: object
    requestUrl: string
    response: T
  }

  interface NamecheapApi {
    domains: {
      dns: {
        setHosts: (args: {
          domainName: string
          hosts: {
            name: string
            type: string
            address: string
            ttl: number
          }[]
        }) => Promise<void>
      }
    }
    config: {
      set: (
        property: 'ApiUser' | 'ApiKey' | 'UserName' | 'ClientIp',
        value: string,
      ) => void
    }
    apiCall: <T = unknown>(
      command:
        | 'namecheap.domains.getList'
        | 'namecheap.domains.getInfo'
        | 'namecheap.domains.dns.getHosts'
        | 'namecheap.domains.dns.setHosts',
      options: object,
    ) => Promise<NamecheapApiResponse<T>>
  }

  const namecheapApi: NamecheapApi
  export = namecheapApi
}
