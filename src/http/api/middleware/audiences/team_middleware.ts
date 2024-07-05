import { FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { TeamWithMembers } from "@/domains/shared/types/team"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"
import { makeConfig } from "@/infrastructure/container"

@injectable()
export class TeamMiddleware {
  constructor(
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
  ) {}

  handle = async (request: FastifyRequest, _: FastifyReply) => {
    const teamHeader = request.headers[
      makeConfig().software.teamHeader
    ] as string

    if (!teamHeader) {
      return
    }

    let team = await this.teamRepository.findById(teamHeader)

    if (!team && request.accessToken.userId) {
      team = await this.teamRepository.findUserDefaultTeam(
        request.accessToken.userId,
      )
    }

    if (team) {
      request.team = team as TeamWithMembers
    }
  }
}
