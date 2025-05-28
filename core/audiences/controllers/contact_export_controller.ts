import { CreateContactExportSchema } from '#root/core/audiences/dto/contact_exports/create_contact_export_dto.js'
import { ExportContactsJob } from '#root/core/audiences/jobs/export_contacts_job.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

/**
 * ContactExportController handles the export of contact data.
 *
 * This controller is responsible for:
 * 1. Initiating asynchronous contact data exports
 * 2. Enforcing proper access control for data export operations
 * 3. Supporting data portability and backup requirements
 *
 * Contact exports allow users to extract their contact data for backup,
 * analysis in external tools, or migration purposes. The export process
 * runs asynchronously to handle large datasets efficiently.
 */
export class ContactExportController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/', this.create.bind(this)]], {
      prefix: 'audiences/:audienceId/exports',
    })
  }

  /**
   * Initiates a new contact export job.
   *
   * Validates the export parameters and queues an asynchronous job
   * to generate the export file. The export includes contact data
   * based on the specified filters and format options.
   */
  async create(ctx: HonoContext) {
    this.ensureCanAdministrate(ctx)

    const payload = await this.validate(ctx, CreateContactExportSchema)

    await Queue.contacts().add(ExportContactsJob.id, {
      ...payload,
      exportedByUserId: this.user(ctx).id,
    })

    return ctx.json({})
  }
}
