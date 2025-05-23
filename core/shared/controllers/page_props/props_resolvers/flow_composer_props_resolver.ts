import { AutomationRepository } from '#root/core/automations/repositories/automation_repository.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'

import type { HonoContext } from '#root/core/shared/server/types.js'
import { container } from '#root/core/utils/typi.js'

export class FlowComposerPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [
      (pathname: string) =>
        pathname.includes('/w/engage/flows/') && pathname.includes('/composer'),
    ]
  }

  async resolve(pathname: string, _defaultProps: DefaultPageProps, _ctx: HonoContext) {
    const automationId = pathname.split('/w/engage/flows/')?.[1]?.split('/composer')?.[0]

    const automation = await container
      .resolve(AutomationRepository)
      .findById(automationId)

    return { automation }
  }
}
