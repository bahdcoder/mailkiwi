import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { DEFAULT_TEAM_NAME } from '#root/database/constants.js'

export function guard(ctx: PageContext) {
  const { user, team } = ctx

  if (!user) {
    throw redirect(route('auth_login'))
  }

  if (team && team.name !== DEFAULT_TEAM_NAME) {
    throw redirect(route('dashboard'))
  }
}
