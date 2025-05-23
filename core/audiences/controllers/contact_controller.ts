import { CreateContactAction } from '#root/core/audiences/actions/contacts/create_contact_action.js'
import { GetContactsAction } from '#root/core/audiences/actions/contacts/get_contacts_action.js'
import { UpdateContactAction } from '#root/core/audiences/actions/contacts/update_contact_action.js'
import { AttachTagsToContactAction } from '#root/core/audiences/actions/tags/attach_tags_to_contact_action.js'
import { DetachTagsFromContactAction } from '#root/core/audiences/actions/tags/detach_tags_from_contact_action.js'
import { CreateContactSchema } from '#root/core/audiences/dto/contacts/create_contact_dto.js'
import { SearchContactsSchema } from '#root/core/audiences/dto/contacts/search_contacts_dto.js'
import { UpdateContactDto } from '#root/core/audiences/dto/contacts/update_contact_dto.js'
import { AttachTagsToContactDto } from '#root/core/audiences/dto/tags/attach_tags_to_contact_dto.js'
import { DetachTagsFromContactDto } from '#root/core/audiences/dto/tags/detach_tags_from_contact_dto.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import type {
  Audience,
  Contact,
  ContactWithProperties,
} from '#root/database/database_schema_types.js'

import { makeApp } from '#root/core/shared/container/index.js'
import type { HonoInstance } from '#root/core/shared/server/hono.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'

/**
 * ContactController manages contact resources within audiences.
 *
 * This controller is responsible for:
 * 1. Creating and managing contacts within audience segments
 * 2. Searching and filtering contacts based on various criteria
 * 3. Managing contact tags and tracking contact activity
 *
 * Contacts are the core recipients of email campaigns in Kibamail. This controller
 * provides comprehensive functionality for managing contact data, including personal
 * information, custom properties, tags, and engagement history.
 */
export class ContactController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ['GET', '/', this.index.bind(this)],
        ['POST', '/search', this.search.bind(this)],
        ['POST', '/', this.store.bind(this)],
        ['GET', '/:contactId', this.get.bind(this)],
        ['PATCH', '/:contactId', this.update.bind(this)],
        ['GET', '/:contactId/activity', this.getActivity.bind(this)],
        ['POST', '/:contactId/tags/attach', this.attachTags.bind(this)],
        ['POST', '/:contactId/tags/detach', this.detachTags.bind(this)],
      ],
      {
        prefix: 'audiences/:audienceId/contacts',
      },
    )
  }

  /**
   * Helper method to retrieve paginated contacts for an audience.
   *
   * Handles pagination parameters and optional segment filtering.
   */
  paginatedContacts = (ctx: HonoContext, audienceId: string) =>
    container
      .make(GetContactsAction)
      .handle(
        audienceId,
        ctx.req.query('segmentId') as string,
        Number.parseInt(ctx.req.query('page') ?? '1'),
        Number.parseInt(ctx.req.query('perPage') ?? '10'),
      )

  /**
   * Searches contacts based on filter criteria.
   *
   * Allows advanced filtering of contacts within an audience using
   * various search parameters and conditions.
   */
  async search(ctx: HonoContext) {
    const payload = await this.validate(ctx, SearchContactsSchema)

    return ctx.json(
      await container
        .make(GetContactsAction)
        .handle(
          ctx.req.param('audienceId'),
          ctx.req.query('segmentId') as string,
          Number.parseInt(ctx.req.query('page') ?? '1'),
          Number.parseInt(ctx.req.query('perPage') ?? '10'),
          payload.filters,
        ),
    )
  }

  /**
   * Lists all contacts for an audience.
   *
   * Returns a paginated list of contacts that belong to the specified audience.
   */
  async index(ctx: HonoContext) {
    return ctx.json(await this.paginatedContacts(ctx, ctx.req.param('audienceId')))
  }

  /**
   * Retrieves a specific contact with its properties.
   *
   * Returns detailed information about a contact, including custom properties
   * and associated metadata.
   */
  async get(ctx: HonoContext) {
    const [audience, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<ContactWithProperties>(ctx, 'contactId'),
    ])

    return ctx.json(contact)
  }

  /**
   * Retrieves activity history for a contact.
   *
   * Returns a chronological list of interactions and events associated with
   * the specified contact, such as email opens, clicks, and form submissions.
   */
  async getActivity(ctx: HonoContext) {
    const [audience, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<ContactWithProperties>(ctx, 'contactId'),
    ])

    return ctx.json(await container.make(ContactRepository).getActivity(contact.id))
  }

  /**
   * Creates a new contact in an audience.
   *
   * Validates the contact data and creates a new contact record with
   * the specified properties in the given audience.
   */
  async store(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateContactSchema)

    const contact = await container.resolve(CreateContactAction).handle(data, audience)

    return ctx.json(contact)
  }

  /**
   * Updates an existing contact.
   *
   * Modifies contact information and properties while ensuring
   * the user has proper authorization to make changes.
   */
  async update(ctx: HonoContext) {
    const [audience, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<ContactWithProperties>(ctx, 'contactId'),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, UpdateContactDto)

    const { id } = await container
      .resolve(UpdateContactAction)
      .handle(contact, audience, data)

    return ctx.json({ id }, 200)
  }

  /**
   * Attaches tags to a contact.
   *
   * Adds one or more tags to a contact for segmentation and
   * organizational purposes.
   */
  async attachTags(ctx: HonoContext) {
    const [, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<Contact>(ctx, 'contactId'),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, AttachTagsToContactDto)

    await container.resolve(AttachTagsToContactAction).handle(contact.id, data)

    return ctx.json({ id: contact.id })
  }

  /**
   * Removes tags from a contact.
   *
   * Detaches one or more tags from a contact, updating their
   * segmentation and categorization.
   */
  async detachTags(ctx: HonoContext) {
    const [, contact] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<Contact>(ctx, 'contactId'),
    ])

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, DetachTagsFromContactDto)

    await container.resolve(DetachTagsFromContactAction).handle(contact.id, data)

    return ctx.json({ id: contact.id })
  }
}
