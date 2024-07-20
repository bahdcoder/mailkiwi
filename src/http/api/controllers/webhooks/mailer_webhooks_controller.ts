import { inject, injectable } from "tsyringe"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class MailerWebhooksContorller {
  constructor(
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: HonoInstance,
  ) {
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
