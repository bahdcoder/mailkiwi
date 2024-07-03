import { TeamRepository } from "@/domains/teams/repositories/team_repository"

import { FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

@injectable()
export class TeamMiddleware {
  constructor(
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
  ) {}

  handle = async (request: FastifyRequest, response: FastifyReply) => {
    const teamHeader = request.headers["x-bamboomailer-team-id"] as string

    if (!teamHeader) {
      return
    }

    const team = await this.teamRepository.findById(teamHeader)

    if (team) {
      request.team = team
    }
  }
}
