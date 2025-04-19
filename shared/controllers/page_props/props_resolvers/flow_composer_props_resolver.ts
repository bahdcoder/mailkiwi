import { AutomationRepository } from '@/automations/repositories/automation_repository.js'
import type { DefaultPageProps } from '@/pages/types/page-context.js'
import { PagePropsResolverContract } from '@/shared/controllers/page_props/page_props_resolver_contract.js'

import type { HonoContext } from '@/shared/server/types.js'
import { container } from '@/utils/typi.js'

export class FlowComposerPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [
      (pathname: string) =>
        pathname.includes('/w/engage/flows/') && pathname.includes('/composer'),
    ]
  }

  async resolve(pathname: string, defaultProps: DefaultPageProps, ctx: HonoContext) {
    const automationId = pathname.split('/w/engage/flows/')?.[1]?.split('/composer')?.[0]

    d('#+++++++++++++++++++++++++++++', { automationId })

    const automation = await container
      .resolve(AutomationRepository)
      .findById(automationId)

    return { automation }
  }
}
