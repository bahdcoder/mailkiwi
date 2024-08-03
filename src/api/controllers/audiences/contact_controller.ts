import { CreateContactAction } from "@/audiences/actions/contacts/create_contact_action.js";
import { GetContactsAction } from "@/audiences/actions/contacts/get_contacts_action.ts";
import { UpdateContactAction } from "@/audiences/actions/contacts/update_contact_action.js";
import { AttachTagsToContactAction } from "@/audiences/actions/tags/attach_tags_to_contact_action.js";
import { DetachTagsFromContactAction } from "@/audiences/actions/tags/detach_tags_from_contact_action.js";
import { CreateContactSchema } from "@/audiences/dto/contacts/create_contact_dto.js";
import { UpdateContactDto } from "@/audiences/dto/contacts/update_contact_dto.js";
import { AttachTagsToContactDto } from "@/audiences/dto/tags/attach_tags_to_contact_dto.js";
import { DetachTagsFromContactDto } from "@/audiences/dto/tags/detach_tags_from_contact_dto.js";
import { AudiencePolicy } from "@/audiences/policies/audience_policy.js";
import { BaseController } from "@/shared/controllers/base_controller.js";
import { AudienceValidationAndAuthorizationConcern } from "@/api/concerns/audience_validation_concern.js";
import { E_UNAUTHORIZED } from "@/http/responses/errors.js";
import { makeApp } from "@/shared/container/index.js";
import type { HonoInstance } from "@/server/hono.js";
import type { HonoContext } from "@/server/types.js";
import { container } from "@/utils/typi.js";

export class ContactController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),
    private audienceValidationAndAuthorizationConcern: AudienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
  ) {
    super();

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
        ["POST", "/:contactId/tags/attach", this.attachTags.bind(this)],
        ["POST", "/:contactId/tags/detach", this.detachTags.bind(this)],
        ["PATCH", "/:contactId", this.update.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/contacts",
      },
    );
  }

  async index(ctx: HonoContext) {
    const paginatedContacts = await container
      .make(GetContactsAction)
      .handle(
        ctx.req.param("audienceId"),
        ctx.req.query("segmentId"),
        Number.parseInt(ctx.req.query("page") ?? "1"),
        Number.parseInt(ctx.req.query("perPage") ?? "10"),
      );

    return ctx.json(paginatedContacts);
  }

  async store(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      );
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    );

    const data = await this.validate(ctx, CreateContactSchema);

    const team = this.ensureTeam(ctx);

    const policy = container.resolve(AudiencePolicy);

    if (!policy.canCreate(team, ctx.get("accessToken").userId))
      throw E_UNAUTHORIZED();

    const action = container.resolve(CreateContactAction);

    const contact = await action.handle(data, ctx.req.param("audienceId"));

    return ctx.json(contact);
  }

  async update(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      );
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    );

    const contactId = ctx.req.param("contactId");
    const data = await this.validate(ctx, UpdateContactDto);

    const action = container.resolve(UpdateContactAction);

    const updatedContact = await action.handle(contactId, data);

    return ctx.json(updatedContact, 200);
  }

  async attachTags(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      );
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    );

    const contactId = ctx.req.param("contactId");

    const data = await this.validate(ctx, AttachTagsToContactDto);

    await container.resolve(AttachTagsToContactAction).handle(contactId, data);

    return ctx.json({ id: contactId });
  }

  async detachTags(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      );
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    );

    const contactId = ctx.req.param("contactId");

    const data = await this.validate(ctx, DetachTagsFromContactDto);

    const action = container.resolve(DetachTagsFromContactAction);

    await container
      .resolve(DetachTagsFromContactAction)
      .handle(contactId, data);

    return ctx.json({ id: contactId });
  }
}
