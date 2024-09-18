import { makeApp } from "@/shared/container/index.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

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
