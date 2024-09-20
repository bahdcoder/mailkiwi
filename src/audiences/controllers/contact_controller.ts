import { CreateContactAction } from "@/audiences/actions/contacts/create_contact_action.js"
import { GetContactsAction } from "@/audiences/actions/contacts/get_contacts_action.js"
import { UpdateContactAction } from "@/audiences/actions/contacts/update_contact_action.js"
import { AttachTagsToContactAction } from "@/audiences/actions/tags/attach_tags_to_contact_action.js"
import { DetachTagsFromContactAction } from "@/audiences/actions/tags/detach_tags_from_contact_action.js"
import { CreateContactSchema } from "@/audiences/dto/contacts/create_contact_dto.js"
import { UpdateContactDto } from "@/audiences/dto/contacts/update_contact_dto.js"
import { AttachTagsToContactDto } from "@/audiences/dto/tags/attach_tags_to_contact_dto.js"
import { DetachTagsFromContactDto } from "@/audiences/dto/tags/detach_tags_from_contact_dto.js"

import {
  Audience,
  Contact,
} from "@/database/schema/database_schema_types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class ContactController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

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
    )
  }

  async index(ctx: HonoContext) {
    const paginatedContacts = await container
      .make(GetContactsAction)
      .handle(
        parseInt(ctx.req.param("audienceId")),
        parseInt(ctx.req.query("segmentId") as string),
        Number.parseInt(ctx.req.query("page") ?? "1"),
        Number.parseInt(ctx.req.query("perPage") ?? "10"),
      )

    return ctx.json(paginatedContacts)
  }

  async store(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateContactSchema)

    const contact = await container
      .resolve(CreateContactAction)
      .handle(data, audience.id)

    return ctx.json(contact)
  }

  async update(ctx: HonoContext) {
    const [, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, "audienceId"),
      this.ensureExists<Contact>(ctx, "contactId"),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, UpdateContactDto)

    const { id } = await container
      .resolve(UpdateContactAction)
      .handle(contact.id, data)

    return ctx.json({ id }, 200)
  }

  async attachTags(ctx: HonoContext) {
    const [, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, "audienceId"),
      this.ensureExists<Contact>(ctx, "contactId"),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, AttachTagsToContactDto)

    await container
      .resolve(AttachTagsToContactAction)
      .handle(contact.id, data)

    return ctx.json({ id: contact.id })
  }

  async detachTags(ctx: HonoContext) {
    const [, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, "audienceId"),
      this.ensureExists<Contact>(ctx, "contactId"),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, DetachTagsFromContactDto)

    await container
      .resolve(DetachTagsFromContactAction)
      .handle(contact.id, data)

    return ctx.json({ id: contact.id })
  }
}
