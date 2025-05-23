import type { Next } from 'hono'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

export class AuthorizeSendingDomainMiddleware {
  constructor(private teamRepository = container.make(TeamRepository)) {}
  handle = async (ctx: HonoContext, next: Next) => {
    const accessToken = ctx.get('accessToken')

    await next()
  }
}
