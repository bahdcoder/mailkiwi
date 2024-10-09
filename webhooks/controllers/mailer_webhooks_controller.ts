import { makeApp } from "@/shared/container/index.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

export class MailerWebhooksContorller {
  constructor(private app: HonoInstance = makeApp()) {
    this.app.defineRoutes([], {
      prefix: "webhooks",
      middleware: [],
    })
  }

  async ses(ctx: HonoContext) {
    return ctx.json({ Ok: true })
  }
}
