import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { ContainerKey } from "@/infrastructure/container.js"

@injectable()
export class MailerWebhooksContorller {
  constructor(
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["POST", "/ses", this.ses],
        // ["POST", "/postmark", this.process],
        // ["POST", "/sendgrid", this.process],
      ],
      {
        prefix: "webhooks",
        onRequestHooks: [],
      },
    )
  }

  async ses(request: FastifyRequest, response: FastifyReply) {
    const payload = JSON.parse(request.body as string)

    switch (request.headers["x-amz-sns-message-type"]) {
      case "SubscriptionConfirmation":
        await fetch(payload.SubscribeURL)
        break
      default:
        break
    }

    response.code(200).send({ Ok: true })
  }
}
