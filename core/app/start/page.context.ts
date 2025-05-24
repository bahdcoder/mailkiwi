import type { RuntimeAdapter } from 'vike-server/hono'

import { container } from '#root/core/utils/typi'
import { DefaultPropsResolver } from '#root/core/shared/controllers/page_props/props_resolvers/default_props_resolver'
import { PagePropsResolver } from '#root/core/shared/controllers/page_props/page_props_resolver'
import type { DefaultPageProps } from '#root/pages/types/page-context'

export async function pageContext({ hono: ctx }: RuntimeAdapter) {
  const defaultProps = await container.make(DefaultPropsResolver).resolve(ctx)

  return {
    pageProps: await container
      .make(PagePropsResolver)
      .handle(ctx, defaultProps as DefaultPageProps),
    ...defaultProps,
  }
}
