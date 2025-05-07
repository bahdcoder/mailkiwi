import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'

import { route } from '@/shared/routes/route_aliases.js'

export function guard(ctx: PageContext) {
  console.log({ pageProps: ctx.pageProps })
  if (ctx.urlPathname === route('engage')) {
    if (!ctx.engage?.onboarded) {
      throw redirect(route('engage_welcome'))
    }
  }
}
