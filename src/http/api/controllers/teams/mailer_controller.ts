import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"
import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy"
import { CreateMailerAction } from "@/domains/teams/actions/mailers/create_mailer_action"
import { UpdateMailerAction } from "@/domains/teams/actions/mailers/update_mailer_action"
import { CreateMailerSchema } from "@/domains/teams/dto/mailers/create_mailer_dto"
import { UpdateMailerSchema } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class MailerController {
  constructor(
    @inject(MailerRepository) private mailerRepository: MailerRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["POST", "/", this.store.bind(this)],
        ["PATCH", "/:mailer", this.update.bind(this) as RouteHandlerMethod],
      ],
      {
        prefix: "mailers",
      },
    )
  }

  async store(request: FastifyRequest, _: FastifyReply) {
    const { success, error, data } = CreateMailerSchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canAdministrate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<CreateMailerAction>(CreateMailerAction)

    const mailer = await action.handle(data, request.team)

    return mailer
  }

  async update(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
    _: FastifyReply,
  ) {
    const { success, error, data } = UpdateMailerSchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const mailerId = request.params.mailerId

    let mailer = await this.mailerRepository.findById(mailerId)

    if (!mailer)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown mailer.", path: ["mailerId"] }],
      })

    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canAdministrate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<UpdateMailerAction>(UpdateMailerAction)

    mailer = await action.handle(mailer, data, request.team)

    return mailer
  }
}
