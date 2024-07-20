import { makeApp } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.js"
import { HonoContext } from "@/infrastructure/server/types.js"

export class RootController {
  constructor(private app: HonoInstance = makeApp()) {
    this.app.defineRoutes([["GET", "*", this.index.bind(this)]], {
      prefix: "p",
      middleware: [],
    })
  }

  async index(ctx: HonoContext) {
    return ctx.html("<h1>Hello World from the root controller.</h1>")
  }
}
