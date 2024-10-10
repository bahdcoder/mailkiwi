import { apiEnv } from "@/api/env/api_env.js"
import { InjectEmailSchema } from "@/injector/dto/inject_email_dto.js"
import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { AuthorizeSendingDomainMiddleware } from "@/injector/middleware/authorize_sending_domain_middleware.js"
import { getDomainFromEmail } from "@/injector/utils/get_domain_from_email.js"
import { InjectTrackingLinksIntoEmailAction } from "@/kumomta/actions/inject_tracking_links_into_email_action.js"
import { v4 } from "uuid"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { HonoContext } from "@/shared/server/types.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"
import { generateMessageIdForDomain } from "@/shared/utils/string.js"

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

    const sendingDomain = this.ensureCanSendFromDomain(
      ctx,
      getDomainFromEmail(payload.from.email),
    )

    let htmlMessage = payload.html

    if (htmlMessage) {
      const { html: trackedHtml, trackingSignatures } = container
        .make(InjectTrackingLinksIntoEmailAction)
        .rewriteHrefAttributes(
          htmlMessage,
          `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`,
        )

      htmlMessage = trackedHtml
    }

    const messageId = generateMessageIdForDomain(sendingDomain.name)

    const { data, error } = await makeHttpClient()
      .url(`${apiEnv.MTA_INJECTOR_URL}/api/inject/v1`)
      .post()
      .payload({
        envelope_sender: `bounces@${sendingDomain.returnPathSubDomain}.${sendingDomain.name}`,
        recipients: payload.recipients,
        from: {
          email: payload.from.email,
          name: payload.from.name,
        },
        content: {
          from: payload.from,
          subject: payload.subject,
          reply_to: payload.replyTo,
          text_body: payload.text,
          html_body: htmlMessage,
          attachments: payload.attachments,
          headers: {
            ...payload.headers,
            "Message-ID": messageId,
            [apiEnv.emailHeaders.messageId]: messageId,
            [apiEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          },
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
