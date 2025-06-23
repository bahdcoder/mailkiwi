import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { excludeKeys } from '#root/core/shared/utils/helpers/exclude_keys'
import { container } from '#root/core/utils/typi'
import type { DefaultPageProps } from '#root/pages/types/page-context'

export class SettingsSendingDomainsPropsResolver {
  static get regex() {
    return [/\/w\/settings\/domains/]
  }

  async resolve(_pathname: string, _defaultProps: DefaultPageProps, ctx: HonoContext) {
    const teamId = ctx.get('team')?.id

    const sendingDomains = await container
      .make(SendingDomainRepository)
      .findAllForTeam(teamId)

    return {
      sendingDomains: sendingDomains.map((domain) =>
        excludeKeys(domain, ['dkimPrivateKey']),
      ),
    }
  }
}
