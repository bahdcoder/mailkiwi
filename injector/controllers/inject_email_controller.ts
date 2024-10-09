import { apiEnv } from "@/api/env/api_env.js"
import { InjectEmailSchema } from "@/injector/dto/inject_email_dto.js"
import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { InjectTrackingLinksIntoEmailAction } from "@/kumomta/actions/inject_tracking_links_into_email_action.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class InjectEmailController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes([["POST", "/inject", this.index.bind(this)]], {
      middleware: [
        container.make(AuthorizeInjectorApiKeyMiddleware).handle,
      ],
    })
  }

  async index(ctx: HonoContext) {
    const payload = await this.validate(ctx, InjectEmailSchema)

    let htmlMessage = payload.html

    // const sendingDomain = await container.make(SendingDomainRepository).findByDomain()

    // if (htmlMessage) {
    //   const trackedMessage = await container
    //     .make(InjectTrackingLinksIntoEmailAction)
    //     .handle(payload.html as string)
    // }

    const { data, error } = await makeHttpClient()
      .url(`${apiEnv.MTA_INJECTOR_URL}/api/inject/v1`)
      .post()
      .payload({
        envelope_sender: payload.from.email,
        recipients: payload.recipients,
        content: {
          from: payload.from,
          subject: payload.subject,
          reply_to: payload.replyTo,
          text_body: payload.text,
          html_body: payload.html,
          attachments: payload.attachments,
          headers: payload.headers,
        },
      })
      .send()

    if (error)
      return ctx.json(
        {
          Ok: false,
          message: "Failed to inject HTTP email message.",
        },
        400,
      )

    return ctx.json({ Ok: true })
  }
}
