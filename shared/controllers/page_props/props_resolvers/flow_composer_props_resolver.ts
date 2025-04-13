import { AutomationRepository } from "@/automations/repositories/automation_repository.js"
import { DefaultPageProps } from "@/pages/types/page-context.js"
import { PagePropsResolverContract } from "@/shared/controllers/page_props/page_props_resolver_contract.js"
import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext } from "@/shared/server/types.js"
import { container } from "@/utils/typi.js"

export class FlowComposerPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [
      function (pathname: string) {
        return (
          pathname.includes("/w/engage/flows/") &&
          pathname.includes("/composer")
        )
      },
    ]
  }

  async resolve(
    pathname: string,
    defaultProps: DefaultPageProps,
    ctx: HonoContext
  ) {
    const automationId = pathname
      .split("/w/engage/flows/")?.[1]
      ?.split("/composer")?.[0]

    const automation = await container
      .resolve(AutomationRepository)
      .findById(automationId)

    return { automation }
  }
}
