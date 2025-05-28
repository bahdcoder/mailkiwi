import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class ReportController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['GET', '/report', this.index.bind(this)]], {
      prefix: 'audiences/:audienceId',
    })
  }

  async index(ctx: HonoContext) {
    // 1. metrics to return:
    // total sends of audience
    // total opens of audience
    // total clicks of audience
  }
}
