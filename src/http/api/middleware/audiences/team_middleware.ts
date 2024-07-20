import { Next } from "hono"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { makeConfig } from "@/infrastructure/container.js"
import { HonoContext } from "@/infrastructure/server/types.ts"
import { container } from "@/utils/typi.ts"

export class TeamMiddleware {
  constructor(
    private teamRepository: TeamRepository = container.make(TeamRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const teamHeader = ctx.req.header(makeConfig().software.teamHeader)

    let team = teamHeader
      ? await this.teamRepository.findById(teamHeader)
      : undefined

    const accessToken = ctx.get("accessToken")

    if (!team && accessToken.userId) {
      team = await this.teamRepository.findUserDefaultTeam(accessToken.userId)
    }

    if (team) {
      ctx.set("team", team)
    }

    await next()
  }
}
