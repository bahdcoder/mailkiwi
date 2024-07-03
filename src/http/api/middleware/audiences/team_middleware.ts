import { FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { TeamWithMembers } from "@/domains/shared/types/team"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"

@injectable()
export class TeamMiddleware {
  constructor(
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
  ) {}

  handle = async (request: FastifyRequest, _: FastifyReply) => {
    const teamHeader = request.headers["x-bamboomailer-team-id"] as string

    if (!teamHeader) {
      return
    }

    const team = await this.teamRepository.findById(teamHeader)

    if (team) {
      request.team = team as TeamWithMembers
    }
  }
}
