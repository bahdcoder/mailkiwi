import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { CreateAudienceAction } from "@/domains/audiences/actions/audiences/create_audience_action.js"
import { UpdateAudienceAction } from "@/domains/audiences/actions/audiences/update_audience_action.js"
import { CreateAudienceSchema } from "@/domains/audiences/dto/audiences/create_audience_dto.js"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy.js"
import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository.js"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.ts"

@injectable()
export class AudienceController extends BaseController {
  constructor(
    @inject(AudienceRepository) private audienceRepository: AudienceRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    super()
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
    const data = this.validate(request, CreateAudienceSchema)

    this.ensureTeam(request)

    const policy = container.resolve<AudiencePolicy>(AudiencePolicy)

    if (!policy.canCreate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<CreateAudienceAction>(CreateAudienceAction)

    const audience = await action.handle(data, request.team.id)

    return audience
  }

  async update(request: FastifyRequest, _: FastifyReply) {
    const data = this.validate(request, CreateAudienceSchema)

    const policy = container.resolve<AudiencePolicy>(AudiencePolicy)

    if (!policy.canCreate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<UpdateAudienceAction>(UpdateAudienceAction)

    const audience = await action.handle(data, request.team.id)

    return audience
  }
}
