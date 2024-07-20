import { inject, injectable } from "tsyringe"

import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class RootController {
  constructor(@inject(ContainerKey.app) private app: HonoInstance) {
    this.app.defineRoutes([["GET", "*", this.index.bind(this)]], {
      prefix: "p",
      middleware: [],
    })
  }

  async index(ctx: HonoContext) {
    return ctx.html("<h1>Hello World from the root controller.</h1>")
  }
}
