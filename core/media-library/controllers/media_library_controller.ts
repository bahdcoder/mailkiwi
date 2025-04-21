import { AddMediaDocumentAction } from '@/media-library/dto/add_media_document_action.js'

import { makeApp } from '@/shared/container/index.js'
import { VikeController } from '@/shared/controllers/vike_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

export class MediaDocumentController extends VikeController {
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
