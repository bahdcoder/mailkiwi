import { appEnv } from "@/app/env/app_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import {
  InjectEmailSchema,
  InjectEmailSchemaDto,
} from "@/injector/dto/inject_email_dto.js"
import { AuthorizeInjectorApiKeyMiddleware } from "@/injector/middleware/authorize_injector_api_key_middleware.js"
import { getDomainFromEmail } from "@/injector/utils/get_domain_from_email.js"
import { InjectTrackingLinksIntoEmailAction } from "@/kumomta/actions/inject_tracking_links_into_email_action.js"

import { InsertEmailSend } from "@/database/database_schema_types.js"

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

    const sends: { id: string; payload: InsertEmailSend }[] = []

    for (const recipient of payload.recipients) {
      const { id, messageId } = generateMessageIdForDomain(
        sendingDomain.name,
      )

      let htmlMessage = payload.html

      let links: string[] = []

      let clickTrackingEnabled = sendingDomain.clickTrackingEnabled
      let openTrackingEnabled = sendingDomain.openTrackingEnabled

      if (payload.clickTrackingEnabled !== undefined) {
        clickTrackingEnabled = payload.clickTrackingEnabled
      }

      if (payload.openTrackingEnabled !== undefined) {
        openTrackingEnabled = payload.openTrackingEnabled
      }

      const injectTrackingLinksEmailAction = container.make(
        InjectTrackingLinksIntoEmailAction,
      )
      const sendingDomainName = `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`

      const metadata = { m: id }

      if (htmlMessage && clickTrackingEnabled) {
        const { html: trackedHtml, trackingSignatures } =
          injectTrackingLinksEmailAction.rewriteHrefAttributes(
            htmlMessage,
            sendingDomainName,
            metadata,
          )

        trackingSignatures.forEach((signature) => {
          links.push(signature[1])
        })

        htmlMessage = trackedHtml
      }

      if (htmlMessage && openTrackingEnabled) {
        const { html: trackedOpensHtml } =
          injectTrackingLinksEmailAction.injectTrackingPixel(
            htmlMessage,
            sendingDomainName,
            metadata,
          )

        htmlMessage = trackedOpensHtml
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
            [appEnv.emailHeaders.messageId]: messageId,
            [appEnv.emailHeaders.emailSendId]: id,
            [appEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          },
        },
      }

      const injection: Injection = {
        messageId: id,
        recipient,
        handle() {
          return makeHttpClient()
            .url(`${appEnv.MTA_INJECTOR_URL}/api/inject/v1`)
            .post()
            .payload(injectEmailPayload)
            .send()
        },
      }

      injections.push(injection)

      sends.push({
        id,
        payload: {
          links,
          product: "send",
          clickTrackingEnabled,
          openTrackingEnabled,
        },
      })
    }

    await container.make(EmailSendRepository).bulkCreate(sends)

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
        .map((result) => ({
          ok: true,
          messageId: result.value?.messageId,
          recipient: result.value?.recipient,
        })),
    })
  }
}
