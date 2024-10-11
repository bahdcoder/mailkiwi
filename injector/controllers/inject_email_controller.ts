import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import {
  InjectEmailSchema,
  InjectEmailSchemaDto,
} from "@/injector/dto/inject_email_dto.js"
import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { getDomainFromEmail } from "@/injector/utils/get_domain_from_email.js"
import { InjectTrackingLinksIntoEmailAction } from "@/kumomta/actions/inject_tracking_links_into_email_action.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { HonoContext } from "@/shared/server/types.js"
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

    type Injection = {
      messageId: string
      recipient: InjectEmailSchemaDto["recipients"][number]
      handle: () => Promise<{
        data: unknown
        error: string | null
      }>
    }

    const injections: Injection[] = []

    const sends: { id: string; links: string[] }[] = []

    for (const recipient of payload.recipients) {
      const { id, messageId } = generateMessageIdForDomain(
        sendingDomain.name,
      )

      let htmlMessage = payload.html

      let links: string[] = []

      if (htmlMessage) {
        const { html: trackedHtml, trackingSignatures } = container
          .make(InjectTrackingLinksIntoEmailAction)
          .rewriteHrefAttributes(
            htmlMessage,
            `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`,
            { m: id },
          )

        trackingSignatures.forEach((signature) => {
          links.push(signature[1])
        })

        htmlMessage = trackedHtml
      }

      const injectEmailPayload = {
        envelope_sender: `bounces@${sendingDomain.returnPathSubDomain}.${sendingDomain.name}`,
        recipients: [recipient],
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
            [apiEnv.emailHeaders.emailSendId]: id,
            [apiEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          },
        },
      }

      const injection: Injection = {
        messageId: id,
        recipient,
        handle() {
          return makeHttpClient()
            .url(`${apiEnv.MTA_INJECTOR_URL}/api/inject/v1`)
            .post()
            .payload(injectEmailPayload)
            .send()
        },
      }

      injections.push(injection)

      sends.push({ id, links })
    }

    await container.make(EmailSendRepository).bulkCreate(
      sends.map((send) => ({
        id: send.id,
        payload: { links: send.links },
      })),
    )

    const results = await Promise.allSettled(
      injections.map(async function (injection) {
        async function attemptInjection() {
          try {
            const response = await injection.handle()
            return {
              ...response,
              messageId: injection.messageId,
              recipient: injection.recipient,
            }
          } catch (error) {
            return false
          }
        }

        let attempts = 2

        while (attempts > 0) {
          const result = await attemptInjection()

          if (!result) {
            attempts--
            break
          }

          return result
        }
      }),
    )

    return ctx.json({
      messages: results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value),
    })
  }
}
