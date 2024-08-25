import type { HonoInstance } from "@/server/hono.js"
import type { HonoContext } from "@/server/types.js"

import { makeApp } from "@/shared/container/index.js"

export class MailerWebhooksContorller {
  constructor(private app: HonoInstance = makeApp()) {
    this.app.defineRoutes(
      [
        ["POST", "/ses", this.ses],
        // ["POST", "/postmark", this.process],
        // ["POST", "/sendgrid", this.process],
      ],
      {
        prefix: "webhooks",
        middleware: [],
      },
    )
  }

  async ses(ctx: HonoContext) {
    const payload = JSON.parse(await ctx.req.text())

    switch (ctx.req.header("x-amz-sns-message-type")) {
      case "SubscriptionConfirmation":
        await fetch(payload.SubscribeURL)
        break
      default:
        break
    }

    return ctx.json({ Ok: true })
  }
}
