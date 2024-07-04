import { FastifyInstance, FastifyRequest, RouteHandlerMethod } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy"
import { CreateMailerIdentityAction } from "@/domains/teams/actions/create_mailer_identity_action"
import { GetMailerIdentitiesAction } from "@/domains/teams/actions/get_mailer_identities_action"
import { CreateMailerIdentitySchema } from "@/domains/teams/dto/create_mailer_identity_dto"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class MailerIdentityController {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["GET", "/identities", this.index.bind(this) as RouteHandlerMethod],
        ["POST", "/identities", this.create.bind(this) as RouteHandlerMethod],
      ],
      {
        prefix: "mailers/:mailerId",
      },
    )
  }

  async index(request: FastifyRequest<{ Params: { mailerId: string } }>) {
    const mailer = await this.ensureMailerExists(request)

    const identities = await this.mailerIdentityRepository.findMany({
      where: {
        mailerId: mailer.id,
      },
    })

    const action = container.resolve<GetMailerIdentitiesAction>(
      GetMailerIdentitiesAction,
    )

    return action.handle(identities, mailer, request.team)
  }

  async create(request: FastifyRequest<{ Params: { mailerId: string } }>) {
    const mailer = await this.ensureMailerExists(request)

    await this.ensureHasPermissions(request)

    const { data, success, error } = CreateMailerIdentitySchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const action = container.resolve<CreateMailerIdentityAction>(
      CreateMailerIdentityAction,
    )

    const identity = await action.handle(data, mailer, request.team)

    return identity
  }

  protected async ensureMailerExists(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
  ) {
    const mailer = await this.mailerRepository.findById(
      request.params.mailerId,
      {
        where: {
          teamId: request.team.id,
          id: request.params.mailerId,
        },
      },
    )

    if (!mailer)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown mailer.", path: ["mailerId"] }],
      })

    return mailer
  }

  protected async ensureHasPermissions(request: FastifyRequest) {
    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canAdministrate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()
  }
}
