import { CreateContactAction } from "@/domains/audiences/actions/contacts/create_contact_action.js"
import { CreateContactSchema } from "@/domains/audiences/dto/contacts/create_contact_dto.js"
import { AttachTagsToContactDto } from "@/domains/audiences/dto/tags/attach_tags_to_contact_dto.ts"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.js"
import { E_UNAUTHORIZED } from "@/http/responses/errors.js"
import { makeApp } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.js"
import { HonoContext } from "@/infrastructure/server/types.js"
import { container } from "@/utils/typi.js"
import { AttachTagsToContactAction } from "@/domains/audiences/actions/tags/attach_tags_to_contact_action.js"
import { DetachTagsFromContactDto } from "@/domains/audiences/dto/tags/detach_tags_from_contact_dto.ts"
import { DetachTagsFromContactAction } from "@/domains/audiences/actions/tags/detach_tags_from_contact_action.ts"
import { AudienceValidationAndAuthorizationConcern } from "@/http/api/concerns/audience_validation_concern.ts"
import { UpdateContactDto } from "@/domains/audiences/dto/contacts/update_contact_dto.ts"
import { UpdateContactAction } from "@/domains/audiences/actions/contacts/update_contact_action.ts"

export class ContactController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),
    private audienceValidationAndAuthorizationConcern: AudienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.store.bind(this)],
        ["POST", "/:contactId/tags/attach", this.attachTags.bind(this)],
        ["POST", "/:contactId/tags/detach", this.detachTags.bind(this)],
        ["PATCH", "/:contactId", this.update.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/contacts",
      },
    )
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  async store(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const data = await this.validate(ctx, CreateContactSchema)

    const team = this.ensureTeam(ctx)

    const policy = container.resolve(AudiencePolicy)

    if (!policy.canCreate(team, ctx.get("accessToken").userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve(CreateContactAction)

    const contact = await action.handle(data, ctx.req.param("audienceId"))

    return ctx.json(contact)
  }

  async update(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const contactId = ctx.req.param("contactId")
    const data = await this.validate(ctx, UpdateContactDto)

    const action = container.resolve(UpdateContactAction)

    const updatedContact = await action.handle(contactId, data)

    return ctx.json(updatedContact, 200)
  }

  async attachTags(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const contactId = ctx.req.param("contactId")

    const data = await this.validate(ctx, AttachTagsToContactDto)

    await container.resolve(AttachTagsToContactAction).handle(contactId, data)

    return ctx.json({ id: contactId })
  }

  async detachTags(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const contactId = ctx.req.param("contactId")

    const data = await this.validate(ctx, DetachTagsFromContactDto)

    const action = container.resolve(DetachTagsFromContactAction)

    await container.resolve(DetachTagsFromContactAction).handle(contactId, data)

    return ctx.json({ id: contactId })
  }
}
