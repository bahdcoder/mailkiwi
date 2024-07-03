import { container, inject, injectable } from "tsyringe"
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"

import { ContainerKey } from "@/infrastructure/container"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository"
import { CreateContactSchema } from "@/domains/audiences/dto/contacts/create_contact_dto"
import { CreateContactAction } from "@/domains/audiences/actions/contacts/create_contact_action"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"
import { TeamPolicy } from "@/domains/audiences/policies/team_policy"

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
    response: FastifyReply,
  ) {
    const teamId = request.params.teamId

    let team = await this.teamRepository.findById(teamId, {
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
