import { appEnv } from '#root/core/app/env/app_env.js'
import type { Next } from 'hono'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import type { HonoContext } from '#root/core/shared/server/types.js'
import type { TeamWithMembers } from '#root/core/shared/types/team.js'

import { container } from '#root/core/utils/typi.js'

export class TeamMiddleware {
  constructor(private teamRepository: TeamRepository = container.make(TeamRepository)) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const teamHeader = ctx.req.header(appEnv.software.teamHeader)

    let team = teamHeader ? await this.teamRepository.findById(teamHeader) : undefined

    const accessToken = ctx.get('accessToken')

    if (!team && accessToken.userId) {
      team = await this.teamRepository.findUserDefaultTeam(accessToken.userId)
    }

    ctx.set('team', team as TeamWithMembers)

    await next()
  }
}
