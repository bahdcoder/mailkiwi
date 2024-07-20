import { makeApp } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

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
