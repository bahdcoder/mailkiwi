import { container, inject, injectable } from "tsyringe"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

import { ContainerKey } from "@/infrastructure/container"
import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"
import { CreateAudienceSchema } from "@/domains/audiences/dto/audiences/create_audience_dto"
import { CreateAudienceAction } from "@/domains/audiences/actions/audiences/create_audience_action"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy"
import { UpdateAudienceAction } from "@/domains/audiences/actions/audiences/update_audience_action"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"

@injectable()
export class AudienceController {
  constructor(
    @inject(AudienceRepository) private audienceRepository: AudienceRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
      ],
      {
        prefix: "audiences",
      },
    )
  }

  async index(request: FastifyRequest, response: FastifyReply) {
    return response.send([])
  }

  async store(request: FastifyRequest, response: FastifyReply) {
    const { success, error, data } = CreateAudienceSchema.safeParse(
      request.body,
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    if (!request.team)
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "The team is required to create an audience.",
            path: ["email"],
          },
        ],
      })

    const policy = container.resolve<AudiencePolicy>(AudiencePolicy)

    if (!policy.canCreate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<CreateAudienceAction>(CreateAudienceAction)

    const audience = await action.handle(data, request.team.id)

    return { data: audience }
  }

  async update(request: FastifyRequest, response: FastifyReply) {
    const { success, error, data } = CreateAudienceSchema.safeParse(
      request.body,
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const policy = container.resolve<AudiencePolicy>(AudiencePolicy)

    if (!policy.canCreate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<UpdateAudienceAction>(UpdateAudienceAction)

    const audience = await action.handle(data, request.team.id)

    return { data: audience }
  }
}
