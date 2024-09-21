import { CreateContactImportAction } from "@/audiences/actions/contact_imports/create_contact_import_action.js"
import { UpdateContactImportSettingsAction } from "@/audiences/actions/contact_imports/update_contact_import_settings_action.js"
import { UpdateContactImportSettings } from "@/audiences/dto/contact_imports/update_contact_import_settings_dto.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"

import { Audience } from "@/database/schema/database_schema_types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class ContactImportController extends BaseController {
  constructor(
    private app = makeApp(),
    private contactImportRepository = container.make(
      ContactImportRepository,
    ),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["PUT", "/:importId", this.update.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/imports",
      },
    )
  }

  async create(ctx: HonoContext) {
    const form = await ctx.req.formData()

    const audience = await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureBelongsToTeam(ctx, audience)

    const file = form.get("file") as File

    const { id } = await container
      .make(CreateContactImportAction)
      .handle(file, audience.id)

    return ctx.json({ id })
  }

  async update(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureBelongsToTeam(ctx, audience)

    const data = await this.validate(ctx, UpdateContactImportSettings)
    const contactImport = await this.ensureContactImportExists(ctx)

    await container
      .make(UpdateContactImportSettingsAction)
      .handle(contactImport, data)

    return ctx.json({ id: 1 })
  }

  private async ensureContactImportExists(ctx: HonoContext) {
    const importId = ctx.req.param("importId")
    const contactImport =
      await this.contactImportRepository.findById(importId)

    if (!contactImport)
      throw E_VALIDATION_FAILED([
        { message: `Import with ID ${importId} does not exist.` },
      ])

    return contactImport
  }
}
