import { eq } from "drizzle-orm"

import { BaseController } from "@/domains/shared/controllers/base_controller.ts"
import { CreateMailerIdentityAction } from "@/domains/teams/actions/create_mailer_identity_action.js"
import { GetMailerIdentitiesAction } from "@/domains/teams/actions/get_mailer_identities_action.js"
import { DeleteMailerIdentityAction } from "@/domains/teams/actions/mailers/delete_mailer_identity_action.js"
import { CreateMailerIdentitySchema } from "@/domains/teams/dto/create_mailer_identity_dto.js"
import { DeleteMailerIdentitySchema } from "@/domains/teams/dto/delete_mailer_identity_dto.js"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository.js"
import { MailerValidationAndAuthorizationConcern } from "@/http/api/concerns/mailer_validation_concern.ts"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { makeApp } from "@/infrastructure/container.js"
import { mailerIdentities } from "@/infrastructure/database/schema/schema.ts"
import { MailerIdentity } from "@/infrastructure/database/schema/types.ts"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"
import { container } from "@/utils/typi.ts"

export class MailerIdentityController extends BaseController {
  constructor(
    private mailerIdentityRepository: MailerIdentityRepository = container.make(
      MailerIdentityRepository,
    ),
    private app: HonoInstance = makeApp(),
    private mailerValidationAndAuthorizationConcern: MailerValidationAndAuthorizationConcern = container.make(
      MailerValidationAndAuthorizationConcern,
    ),
  ) {
    super()
    this.app.defineRoutes(
      [
        ["GET", "/identities", this.index.bind(this)],
        ["POST", "/identities", this.create.bind(this)],
        ["DELETE", "/identities/:mailerIdentityId", this.delete.bind(this)],
        [
          "POST",
          "/identities/:mailerIdentityId/refresh",
          this.refresh.bind(this),
        ],
      ],
      {
        prefix: "mailers/:mailerId",
      },
    )
  }

  async index(ctx: HonoContext) {
    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(ctx)

    const identities = await this.mailerIdentityRepository.findMany({
      where: eq(mailerIdentities.mailerId, mailer.id),
    })

    const action = container.resolve(GetMailerIdentitiesAction)

    return action.handle(identities, mailer, ctx.get("team"))
  }

  async create(ctx: HonoContext) {
    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(ctx)

    await this.mailerValidationAndAuthorizationConcern.ensureHasPermissions(ctx)

    const data = await this.validate(ctx, CreateMailerIdentitySchema)

    const action = container.resolve<CreateMailerIdentityAction>(
      CreateMailerIdentityAction,
    )

    const identity = await action.handle(data, mailer, ctx.get("team"))

    return ctx.json({ id: identity.id })
  }

  async refresh(ctx: HonoContext) {
    await this.mailerValidationAndAuthorizationConcern.ensureHasPermissions(ctx)

    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(ctx)
    const mailerIdentity = await this.ensureMailerIdentityExists(ctx)

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
      ctx.get("team"),
    )

    const identity = await createIdentityAction.handle(
      {
        type: mailerIdentity.type as NonNullable<MailerIdentity["type"]>,
        value: mailerIdentity.value,
      },
      mailer,
      ctx.get("team"),
    )

    return ctx.json(identity)
  }

  async delete(ctx: HonoContext) {
    await this.mailerValidationAndAuthorizationConcern.ensureHasPermissions(ctx)

    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(ctx)
    const mailerIdentity = await this.ensureMailerIdentityExists(ctx)

    const data = await this.validate(ctx, DeleteMailerIdentitySchema)

    const action = container.resolve(DeleteMailerIdentityAction)

    await action.handle(mailer, mailerIdentity, data, ctx.get("team"))

    return ctx.json({ id: mailerIdentity.id })
  }

  protected async ensureMailerIdentityExists(ctx: HonoContext) {
    const mailerIdentity = await this.mailerIdentityRepository.findById(
      ctx.req.param("mailerIdentityId"),
      [eq(mailerIdentities.mailerId, ctx.req.param("mailerId"))],
    )

    if (!mailerIdentity)
      throw E_VALIDATION_FAILED({
        errors: [
          { message: "Unknown mailer identity.", path: ["mailerIdentityId"] },
        ],
      })

    return mailerIdentity
  }
}
