import type { Next } from "hono"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import type { HonoContext } from "@/server/types.js"

import { makeConfig } from "@/shared/container/index.js"
import { TeamWithMembers } from "@/shared/types/team.ts"

import { container } from "@/utils/typi.js"

export class TeamMiddleware {
  constructor(
    private teamRepository: TeamRepository = container.make(
      TeamRepository,
    ),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const teamHeader = ctx.req.header(makeConfig().software.teamHeader)

    let team = teamHeader
      ? await this.teamRepository.findById(teamHeader)
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
