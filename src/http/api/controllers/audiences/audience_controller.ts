import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { CreateAudienceAction } from "@/domains/audiences/actions/audiences/create_audience_action"
import { UpdateAudienceAction } from "@/domains/audiences/actions/audiences/update_audience_action"
import { CreateAudienceSchema } from "@/domains/audiences/dto/audiences/create_audience_dto"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy"
import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

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

  async store(request: FastifyRequest, _: FastifyReply) {
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

  async update(request: FastifyRequest, _: FastifyReply) {
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
