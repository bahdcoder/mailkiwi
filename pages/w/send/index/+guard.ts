import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function guard(ctx: PageContext) {
  if (ctx.engage.onboarded) {
    throw redirect(route('engage'))
  }
}
