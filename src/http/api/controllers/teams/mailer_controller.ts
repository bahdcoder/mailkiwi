import { eq } from "drizzle-orm"
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"
import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy.js"
import { InstallMailerAction } from "@/domains/teams/actions/install_mailer_action.js"
import { CreateMailerAction } from "@/domains/teams/actions/mailers/create_mailer_action.js"
import { GetMailerAction } from "@/domains/teams/actions/mailers/get_mailer_action.js"
import { UpdateMailerAction } from "@/domains/teams/actions/mailers/update_mailer_action.js"
import { CreateMailerSchema } from "@/domains/teams/dto/mailers/create_mailer_dto.js"
import { UpdateMailerSchema } from "@/domains/teams/dto/mailers/update_mailer_dto.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import {
  E_OPERATION_FAILED,
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { mailers } from "@/infrastructure/database/schema/schema.ts"
import { Mailer } from "@/infrastructure/database/schema/types.ts"

@injectable()
export class MailerController {
  constructor(
    @inject(MailerRepository) protected mailerRepository: MailerRepository,
    @inject(ContainerKey.app) protected app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["POST", "/", this.store.bind(this)],
        ["GET", "/", this.index.bind(this)],
        ["PATCH", "/:mailerId", this.update.bind(this) as RouteHandlerMethod],
        [
          "PATCH",
          "/:mailerId/reconnect",
          this.reconnect.bind(this) as RouteHandlerMethod,
        ],
        [
          "POST",
          "/:mailerId/install",
          this.install.bind(this) as RouteHandlerMethod,
        ],
      ],
      {
        prefix: "mailers",
      },
    )
  }

  async index(request: FastifyRequest, _: FastifyReply) {
    await this.ensureHasPermissions(request)

    const action = container.resolve(GetMailerAction)

    const mailer = await action.handle(request.team)

    return mailer
  }

  async store(request: FastifyRequest, _: FastifyReply) {
    const { success, error, data } = CreateMailerSchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    await this.ensureHasPermissions(request)

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

    const mailer = await this.ensureMailerExists(request)

    await this.ensureHasPermissions(request)

    const action = container.resolve<UpdateMailerAction>(UpdateMailerAction)

    await action.handle(mailer, data, request.team)

    return { id: mailer.id }
  }

  async install(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
    _: FastifyReply,
  ) {
    const mailer = await this.ensureMailerExists(request)

    await this.ensureHasPermissions(request)

    const action = container.resolve<InstallMailerAction>(InstallMailerAction)

    const success = await action.handle(mailer, request.team)

    if (!success) throw E_OPERATION_FAILED("Failed to install mailer.")

    return mailer
  }

  async reconnect(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
    _: FastifyReply,
  ) {
    const mailer = await this.ensureMailerExists(request)

    await this.ensureHasPermissions(request)

    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      request.team.configurationKey,
    )

    const { success, error, data } = UpdateMailerSchema.safeParse(
      request.body ?? {},
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    if (data?.configuration.region !== configuration.region) {
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message:
              "Cannot update region when reconnecting. To change the region of your mailer, please create a new mailer instead.",
            path: ["configuration"],
          },
        ],
      })
    }

    await container
      .resolve<UpdateMailerAction>(UpdateMailerAction)
      .reconnecting()
      .handle(mailer, data, request.team)

    const updatedMailer = await this.mailerRepository.findById(mailer.id)

    await container
      .resolve<InstallMailerAction>(InstallMailerAction)
      .handle(updatedMailer!, request.team)

    return this.mailerRepository.findById(mailer.id)
  }

  protected async ensureMailerExists(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
  ) {
    const mailer = await this.mailerRepository.findById(
      request.params.mailerId,
      [
        eq(mailers.teamId, request.team.id),
        eq(mailers.id, request.params.mailerId),
      ],
    )

    if (!mailer)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown mailer.", path: ["mailerId"] }],
      })

    return mailer as Mailer
  }

  protected async ensureHasPermissions(request: FastifyRequest) {
    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canAdministrate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()
  }
}
