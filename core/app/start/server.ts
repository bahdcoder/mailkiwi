import { apply } from 'vike-server/hono'
import { serve } from 'vike-server/hono/serve'

import { Ignitor } from '#root/core/app/ignitor/ignitor.js'
import { container } from '#root/core/utils/typi'
import { DefaultPropsResolver } from '#root/core/shared/controllers/page_props/props_resolvers/default_props_resolver'
import { PagePropsResolver } from '#root/core/shared/controllers/page_props/page_props_resolver'
import type { DefaultPageProps } from '#root/pages/types/page-context'

const ignitor = await new Ignitor().boot().start()

apply(ignitor.app, {
  async pageContext({ hono: ctx }) {
    const defaultProps = await container.make(DefaultPropsResolver).resolve(ctx)

    return {
      pageProps: await container
        .make(PagePropsResolver)
        .handle(ctx, defaultProps as DefaultPageProps),
      ...defaultProps,
    }
  },
})

serve(ignitor.app, { port: ignitor.env.PORT })
