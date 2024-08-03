import { eq } from "drizzle-orm";

import { BaseController } from "@/shared/controllers/base_controller.js";
import { CreateMailerIdentityAction } from "@/teams/actions/create_mailer_identity_action.js";
import { GetMailerIdentitiesAction } from "@/teams/actions/get_mailer_identities_action.js";
import { DeleteMailerIdentityAction } from "@/teams/actions/mailers/delete_mailer_identity_action.js";
import { CreateMailerIdentitySchema } from "@/teams/dto/create_mailer_identity_dto.js";
import { MailerIdentityRepository } from "@/teams/repositories/mailer_identity_repository.js";
import { MailerValidationAndAuthorizationConcern } from "@/api/concerns/mailer_validation_concern.js";
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js";
import { makeApp } from "@/shared/container/index.js";
import { mailerIdentities } from "@/database/schema/schema.js";
import type { MailerIdentity } from "@/database/schema/types.js";
import type { HonoInstance } from "@/server/hono.js";
import type { HonoContext } from "@/server/types.js";
import { container } from "@/utils/typi.js";

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
    super();
    this.app.defineRoutes(
      [
        ["GET", "/identities", this.index.bind(this)],
        ["POST", "/identities", this.create.bind(this)],
        [
          "POST",
          "/identities/:mailerIdentityId/refresh",
          this.refresh.bind(this),
        ],
      ],
      {
        prefix: "mailers/:mailerId",
      },
    );
  }

  async index(ctx: HonoContext) {
    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(
        ctx,
      );

    const identities = await this.mailerIdentityRepository.findMany({
      where: eq(mailerIdentities.mailerId, mailer.id),
    });

    const action = container.resolve(GetMailerIdentitiesAction);

    return action.handle(identities, mailer, ctx.get("team"));
  }

  async create(ctx: HonoContext) {
    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(
        ctx,
      );

    await this.mailerValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
    );

    const data = await this.validate(ctx, CreateMailerIdentitySchema);

    const action = container.resolve<CreateMailerIdentityAction>(
      CreateMailerIdentityAction,
    );

    const identity = await action.handle(data, mailer, ctx.get("team"));

    return ctx.json({ id: identity.id });
  }

  async refresh(ctx: HonoContext) {
    await this.mailerValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
    );

    const mailer =
      await this.mailerValidationAndAuthorizationConcern.ensureMailerExists(
        ctx,
      );
    const mailerIdentity = await this.ensureMailerIdentityExists(ctx);

    if (
      mailerIdentity.status !== "FAILED" &&
      mailerIdentity.status !== "TEMPORARILY_FAILED" &&
      mailerIdentity.status !== "DENIED"
    ) {
      throw E_VALIDATION_FAILED([
        {
          message: "Only failed mailer identities can restart verification.",
          path: "mailerIdentityId",
        },
      ]);
    }

    const deleteIdentityAction = container.resolve(DeleteMailerIdentityAction);
    const createIdentityAction = container.resolve(CreateMailerIdentityAction);

    await deleteIdentityAction.handle(
      mailer,
      mailerIdentity,
      { deleteOnProvider: true },
      ctx.get("team"),
    );

    const identity = await createIdentityAction.handle(
      {
        type: mailerIdentity.type as NonNullable<MailerIdentity["type"]>,
        value: mailerIdentity.value,
      },
      mailer,
      ctx.get("team"),
    );

    return ctx.json(identity);
  }

  protected async ensureMailerIdentityExists(ctx: HonoContext) {
    const mailerIdentity = await this.mailerIdentityRepository.findById(
      ctx.req.param("mailerIdentityId"),
      [eq(mailerIdentities.mailerId, ctx.req.param("mailerId"))],
    );

    if (!mailerIdentity)
      throw E_VALIDATION_FAILED([
        { message: "Unknown mailer identity.", field: "mailerIdentityId" },
      ]);

    return mailerIdentity;
  }
}
