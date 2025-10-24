import { NamecheapApiTool } from '#root/core/developer-tools/tools/namecheap_api_tool.js'
import { container } from '#root/core/utils/typi.js'
import { $trycatch } from '@tszen/trycatch'

export class GetDomainHostsAction {
  async handle(domain: string) {
    const [hosts, error] = await $trycatch(() =>
      container.resolve(NamecheapApiTool).getDomainHosts(domain),
    )

    if (error === null) {
      return {
        domain,
        hosts: hosts.map((host) => ({
          id: host.HostId,
          name: host.Name,
          type: host.Type,
          address: host.Address,
          ttl: host.TTL,
          mxPref: host.MXPref || null,
          isActive: host.IsActive === 'true',
          friendlyName: host.FriendlyName,
          associatedAppTitle: host.AssociatedAppTitle,
          isDDNSEnabled: host.IsDDNSEnabled === 'true',
        })),
      }
    }

    d({ error })

    return null
  }
}
