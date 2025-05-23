import { AddMediaDocumentAction } from '#root/core/media-library/dto/add_media_document_action.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

export class MediaDocumentController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/', this.store.bind(this)]], {
      prefix: 'media-documents',
    })
  }

  async store(ctx: HonoContext) {
    this.ensureCanAuthor(ctx)
    const team = this.ensureTeam(ctx)

    const form = await ctx.req.formData()

    const file = form.get('file') as File

    const { url } = await container.make(AddMediaDocumentAction).handle(file, team.id)

    return this.response(ctx).json({ url }, 200, true).send()
  }
}
