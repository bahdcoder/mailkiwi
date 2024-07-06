import { FastifyInstance, FastifyRequest, RouteHandlerMethod } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy.js"
import { CreateMailerIdentityAction } from "@/domains/teams/actions/create_mailer_identity_action.js"
import { GetMailerIdentitiesAction } from "@/domains/teams/actions/get_mailer_identities_action.js"
import { DeleteMailerIdentityAction } from "@/domains/teams/actions/mailers/delete_mailer_identity_action.js"
import { CreateMailerIdentitySchema } from "@/domains/teams/dto/create_mailer_identity_dto.js"
import { DeleteMailerIdentitySchema } from "@/domains/teams/dto/delete_mailer_identity_dto.js"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { ContainerKey } from "@/infrastructure/container.js"

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
        [
          "DELETE",
          "/identities/:mailerIdentityId",
          this.delete.bind(this) as RouteHandlerMethod,
        ],
        [
          "POST",
          "/identities/:mailerIdentityId/refresh",
          this.refresh.bind(this) as RouteHandlerMethod,
        ],
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

  async refresh(
    request: FastifyRequest<{
      Params: { mailerId: string; mailerIdentityId: string }
    }>,
  ) {
    await this.ensureHasPermissions(request)

    const mailer = await this.ensureMailerExists(request)
    const mailerIdentity = await this.ensureMailerIdentityExists(request)

    if (
      mailerIdentity.status !== "FAILED" &&
      mailerIdentity.status !== "TEMPORARILY_FAILED" &&
      mailerIdentity.status !== "DENIED"
    ) {
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "Only failed mailer identities can restart verification.",
            path: ["mailerIdentityId"],
          },
        ],
      })
    }

    const deleteIdentityAction = container.resolve(DeleteMailerIdentityAction)
    const createIdentityAction = container.resolve(CreateMailerIdentityAction)

    await deleteIdentityAction.handle(
      mailer,
      mailerIdentity,
      { deleteOnProvider: true },
      request.team,
    )

    const identity = await createIdentityAction.handle(
      { type: mailerIdentity.type, value: mailerIdentity.value },
      mailer,
      request.team,
    )

    return identity
  }

  async delete(
    request: FastifyRequest<{
      Params: { mailerId: string; mailerIdentityId: string }
    }>,
  ) {
    await this.ensureHasPermissions(request)

    const mailer = await this.ensureMailerExists(request)
    const mailerIdentity = await this.ensureMailerIdentityExists(request)

    const { data, success, error } = DeleteMailerIdentitySchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const action = container.resolve(DeleteMailerIdentityAction)

    await action.handle(mailer, mailerIdentity, data, request.team)

    return { id: mailerIdentity.id }
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

  protected async ensureMailerIdentityExists(
    request: FastifyRequest<{
      Params: { mailerId: string; mailerIdentityId: string }
    }>,
  ) {
    const mailerIdentity = await this.mailerIdentityRepository.findById(
      request.params.mailerId,
      {
        where: {
          mailerId: request.params.mailerId,
          id: request.params.mailerIdentityId,
        },
      },
    )

    if (!mailerIdentity)
      throw E_VALIDATION_FAILED({
        errors: [
          { message: "Unknown mailer identity.", path: ["mailerIdentityId"] },
        ],
      })

    return mailerIdentity
  }

  protected async ensureHasPermissions(request: FastifyRequest) {
    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canAdministrate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()
  }
}
