import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class StripeWebhookController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['POST', '/stripe', this.handle.bind(this)]], {
      prefix: 'webhooks',
      middleware: [],
    })
  }

  async handle(ctx: HonoContext) {
    d(await ctx.req.json())
    return ctx.json({})
  }
}
