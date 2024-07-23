import { TeamRepository } from '@/domains/teams/repositories/team_repository.js'
import { makeApp } from '@/infrastructure/container.js'
import type { HonoInstance } from '@/infrastructure/server/hono.js'
import type { HonoContext } from '@/infrastructure/server/types.js'
import { container } from '@/utils/typi.js'

export class MailerWebhooksContorller {
  constructor(
    private teamRepository: TeamRepository = container.make(TeamRepository),
    private app: HonoInstance = makeApp(),
  ) {
    this.app.defineRoutes(
      [
        ['POST', '/ses', this.ses],
        // ["POST", "/postmark", this.process],
        // ["POST", "/sendgrid", this.process],
      ],
      {
        prefix: 'webhooks',
        middleware: [],
      },
    )
  }

  async ses(ctx: HonoContext) {
    const payload = JSON.parse(await ctx.req.text())

    switch (ctx.req.header('x-amz-sns-message-type')) {
      case 'SubscriptionConfirmation':
        await fetch(payload.SubscribeURL)
        break
      default:
        break
    }

    return ctx.json({ Ok: true })
  }
}
