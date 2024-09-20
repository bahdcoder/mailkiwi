import { apiEnv } from "@/api/env/api_env.js"
import type { Next } from "hono"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import type { HonoContext } from "@/shared/server/types.js"
import { TeamWithMembers } from "@/shared/types/team.js"

import { container } from "@/utils/typi.js"

export class TeamMiddleware {
  constructor(
    private teamRepository: TeamRepository = container.make(
      TeamRepository,
    ),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const teamHeader = ctx.req.header(apiEnv.software.teamHeader)

    let team = teamHeader
      ? await this.teamRepository.findById(parseInt(teamHeader))
      : undefined

    const accessToken = ctx.get("accessToken")

    if (!team && accessToken.userId) {
      team = await this.teamRepository.findUserDefaultTeam(
        accessToken.userId,
      )
    }

    ctx.set("team", team as TeamWithMembers)

    await next()
  }
}
