import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class DashboardController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['GET', route('dashboard'), this.show]])
  }

  show = async (ctx: HonoContext) => {}
}
