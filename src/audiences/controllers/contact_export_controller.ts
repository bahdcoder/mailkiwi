import { CreateContactExportSchema } from "@/audiences/dto/contact_exports/create_contact_export_dto.js"
import { ExportContactsJob } from "@/audiences/jobs/export_contacts_job.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Queue } from "@/shared/queue/queue.js"
import type { HonoContext } from "@/shared/server/types.js"

export class ContactExportController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([["POST", "/", this.create.bind(this)]], {
      prefix: "audiences/:audienceId/exports",
    })
  }

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
