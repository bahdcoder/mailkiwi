import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext } from "@/shared/server/types.js"

export class DashboardController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([["GET", route("dashboard"), this.show]])
  }

  show = async (ctx: HonoContext) => {}
}
