import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"
import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class TeamController {
  constructor(
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [["GET", "/:teamId", this.show.bind(this) as RouteHandlerMethod]],
      {
        prefix: "teams",
      },
    )
  }

  async show(
    request: FastifyRequest<{ Params: { teamId: string } }>,
    _: FastifyReply,
  ) {
    const teamId = request.params.teamId

    const team = await this.teamRepository.findById(teamId, {
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
        mailers: {
          select: {
            id: true,
            name: true,
            provider: true,
            status: true,
          },
        },
      },
    })

    if (!team)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown team ID provided.", path: ["teamId"] }],
      })

    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canView(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    return team
  }
}
