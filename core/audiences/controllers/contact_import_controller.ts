import { CreateContactImportAction } from '#root/core/audiences/actions/contact_imports/create_contact_import_action.js'
import { UpdateContactImportSettingsAction } from '#root/core/audiences/actions/contact_imports/update_contact_import_settings_action.js'
import { UpdateContactImportSettingsSchema } from '#root/core/audiences/dto/contact_imports/update_contact_import_settings_dto.js'
import { ContactImportRepository } from '#root/core/audiences/repositories/contact_import_repository.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * ContactImportController handles the import of contacts from external files.
 *
 * This controller is responsible for:
 * 1. Processing CSV file uploads containing contact data
 * 2. Mapping file headers to contact properties
 * 3. Configuring and executing bulk contact imports
 *
 * The import process is designed to be user-friendly while handling large datasets
 * efficiently, with proper validation and error handling to ensure data integrity.
 */
export class ContactImportController extends BaseController {
  constructor(
    private app = makeApp(),
    private contactImportRepository = container.make(ContactImportRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/', this.create.bind(this)],
        ['PUT', '/:importId', this.update.bind(this)],
      ],
      {
        prefix: 'audiences/:audienceId/imports',
      },
    )
  }

  /**
   * Initiates a new contact import process.
   *
   * Handles file upload, performs initial analysis of the CSV data,
   * and returns header mapping information to guide the user through
   * the import configuration process.
   */
  async create(ctx: HonoContext) {
    const form = await ctx.req.formData()

    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    const team = this.ensureBelongsToTeam(ctx, audience)

    const file = form.get('file') as File

    const { id, propertiesMap, headerCounts, headerSamples } = await container
      .make(CreateContactImportAction)
      .handle(file, audience.id, team.id)

    return this.response(ctx)
      .json({ id, propertiesMap, headerCounts, headerSamples }, 200, true)
      .send()
  }

  /**
   * Updates import settings and starts the import process.
   *
   * Configures how CSV headers map to contact properties and
   * initiates the actual import of contacts into the audience.
   */
  async update(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    this.ensureBelongsToTeam(ctx, audience)
    const contactImport = await this.ensureContactImportExists(ctx)

    const data = await this.validate(ctx, UpdateContactImportSettingsSchema)

    await container.make(UpdateContactImportSettingsAction).handle(contactImport, data)

    return this.response(ctx).json({ id: contactImport.id }).send()
  }

  /**
   * Ensures that the requested import exists.
   *
   * Validates that the import ID is valid and belongs to an existing import.
   */
  private async ensureContactImportExists(ctx: HonoContext) {
    const importId = ctx.req.param('importId')
    const contactImport = await this.contactImportRepository.findById(importId)

    if (!contactImport)
      throw E_VALIDATION_FAILED([
        { message: `Import with ID ${importId} does not exist.` },
      ])

    return contactImport
  }
}
