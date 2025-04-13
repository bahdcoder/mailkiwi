import type { DefaultPageProps } from '@/pages/types/page-context.js'

import type { HonoContext } from '@/shared/server/types.js'

import { BroadcastsPropsResolver } from '@/shared/controllers/page_props/props_resolvers/broadcasts_props_resolver.js'
import { EngagePropsResolver } from '@/shared/controllers/page_props/props_resolvers/engage_props_resolver.js'
import { EngageContactsPropsResolver } from '@/shared/controllers/page_props/props_resolvers/engage_contacts_props_resolver.js'
import { FlowComposerPropsResolver } from '@/shared/controllers/page_props/props_resolvers/flow_composer_props_resolver.js'
import { PagePropsResolverContract } from '@/shared/controllers/page_props/page_props_resolver_contract.js'

export class PagePropsResolver {
  protected resolvers: Array<{
    new (): PagePropsResolverContract
    regex: (RegExp | string | ((pathname: string) => boolean))[]
  }> = [
    BroadcastsPropsResolver,
    EngagePropsResolver,
    EngageContactsPropsResolver,
    FlowComposerPropsResolver,
  ]

  handle = async (ctx: HonoContext, defaultPageProps: DefaultPageProps) => {
    const pathname = new URL(ctx.req.url)?.pathname.split('/index.pageContext.json')?.[0]

    const resolver = this.makeResolver(pathname)

    if (!resolver) {
      return defaultPageProps
    }

    return resolver.resolve(pathname, defaultPageProps, ctx)
  }

  private makeResolver(pathname: string) {
    const resolver = this.resolvers.find((resolver) =>
      resolver.regex.some((route) => {
        if (typeof route === 'string') {
          return pathname === route
        }

        if (typeof route === 'function') {
          return route(pathname)
        }

        console.log(route, pathname)

        return route.test(pathname)
      }),
    )

    if (!resolver) {
      return null
    }

    return new resolver()
  }
}
