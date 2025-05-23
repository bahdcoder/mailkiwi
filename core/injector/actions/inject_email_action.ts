import { appEnv } from '#root/core/app/env/app_env.js'
import { EmailSendRepository } from '#root/core/email_sends/repositories/email_send_repository.js'
import type { InjectEmailSchemaDto } from '#root/core/injector/dto/inject_email_dto.js'
import { InjectTrackingLinksIntoEmailAction } from '#root/core/kumomta/actions/inject_tracking_links_into_email_action.js'

import type {
  InsertEmailSend,
  SendingDomain,
} from '#root/database/database_schema_types.js'

import { makeHttpClient } from '#root/core/shared/http/http_client.js'
import { generateMessageIdForDomain } from '#root/core/shared/utils/string.js'

import { container } from '#root/core/utils/typi.js'

/**
 * InjectEmailAction is responsible for preparing and injecting emails into the Mail Transfer Agent (MTA).
 *
 * This class is a critical component in Kibamail's email delivery infrastructure, handling:
 * 1. Email preparation with proper headers and tracking elements
 * 2. Link and open tracking injection based on configuration
 * 3. Message ID generation and tracking for analytics
 * 4. Bulk email injection with retry logic
 * 5. Recording email sends in the database for analytics and tracking
 *
 * The class works with both marketing ('engage') and transactional ('send') emails,
 * applying different business rules to each type. It's designed to handle both
 * single emails and bulk sends efficiently.
 */
export class InjectEmailAction {
  /**
   * Prepares and injects emails into the Mail Transfer Agent (MTA) for delivery.
   *
   * This complex method orchestrates the entire email preparation and injection process:
   *
   * 1. For each recipient, generates a unique message ID for tracking
   * 2. Applies link tracking by rewriting URLs if enabled
   * 3. Injects open tracking pixel if enabled
   * 4. Prepares the email with proper headers and envelope settings
   * 5. Records the email send in the database for analytics
   * 6. Injects the email into the MTA with retry logic
   *
   * The method handles both marketing ('engage') and transactional ('send') emails,
   * identified by the presence of a broadcastId header. This distinction affects
   * how the email is tracked and processed throughout the system.
   *
   * @param payload - The email content and recipient information
   * @param sendingDomain - The domain configuration to use for sending
   * @returns Object containing the results of the email injection
   */
  async handle(payload: InjectEmailSchemaDto, sendingDomain: SendingDomain) {
    type Injection = {
      messageId: string
      recipient: InjectEmailSchemaDto['recipients'][number]
      handle: () => Promise<{
        data: {
          success_count: number
          fail_count: number
          errors: string[]
        }
        error: string | null
      }>
    }

    const injections: Injection[] = []

    const sends: { id: string; payload: InsertEmailSend }[] = []

    for (const recipient of payload.recipients) {
      const { id, messageId } = generateMessageIdForDomain(sendingDomain.name)

      let htmlMessage = payload.html

      const links: string[] = []

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

      // Apply link tracking if enabled by rewriting all <a href> links in the HTML content
      // This process:
      // 1. Extracts all links from the HTML
      // 2. Replaces them with tracking URLs that point to Kibamail's tracking domain
      // 3. Stores the original URLs to redirect users when they click
      // 4. Captures the tracking signatures for analytics
      //
      // When a recipient clicks a tracked link, the system records the event and redirects
      // to the original URL, enabling click tracking while preserving the user experience
      if (htmlMessage && clickTrackingEnabled) {
        const { html: trackedHtml, trackingSignatures } =
          injectTrackingLinksEmailAction.rewriteHrefAttributes(
            htmlMessage,
            sendingDomainName,
            metadata,
          )

        for (const signature of trackingSignatures) {
          links.push(signature[1])
        }

        htmlMessage = trackedHtml
      }

      // Add open tracking pixel if enabled by injecting a 1x1 transparent image
      // This invisible image is loaded from Kibamail's tracking servers when the email is opened,
      // allowing the system to detect when recipients view the email
      //
      // The pixel is added at the end of the HTML content to ensure it's loaded
      // even if the email client blocks remote images by default
      if (htmlMessage && openTrackingEnabled) {
        const { html: trackedOpensHtml } =
          injectTrackingLinksEmailAction.injectTrackingPixel(
            htmlMessage,
            sendingDomainName,
            metadata,
          )

        htmlMessage = trackedOpensHtml
      }

      // Prepare the final email payload for injection into the MTA
      // This includes:
      // 1. Setting the envelope sender with a domain-specific bounce address
      //    (enables proper bounce handling and feedback loop processing)
      // 2. Configuring all content including HTML, text, and attachments
      // 3. Adding all required headers for tracking and compliance
      //
      // The custom headers (X-Kibamail-*) are critical for the entire tracking system,
      // connecting email events back to specific sends, broadcasts, and contacts
      const injectEmailPayload = {
        envelope_sender: `bounces@${sendingDomain.returnPathSubDomain}.${sendingDomain.name}`,
        recipients: [recipient],
        content: {
          from: payload.from,
          subject: payload.subject,
          reply_to: payload.replyTo,
          text_body: payload.text,
          html_body: htmlMessage,
          attachments: payload.attachments,
          headers: {
            ...payload.headers,
            'Message-ID': messageId,
            [appEnv.emailHeaders.emailSendId]: id,
            [appEnv.emailHeaders.messageId]: messageId,
            [appEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          },
        },
      }

      const injection: Injection = {
        messageId: id,
        recipient,
        handle() {
          return makeHttpClient<
            object,
            Awaited<ReturnType<Injection['handle']>>['data']
          >()
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
          product: payload.headers?.[appEnv.emailHeaders.broadcastId] ? 'engage' : 'send',
          clickTrackingEnabled,
          openTrackingEnabled,
          contactId: payload.headers?.[appEnv.emailHeaders.contactId],
          broadcastId: payload.headers?.[appEnv.emailHeaders.broadcastId],
        },
      })
    }

    await container.make(EmailSendRepository).bulkCreate(sends)

    const results = await Promise.allSettled(
      injections.map(async (injection) => {
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

    return {
      messages: results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => {
          const ok = result.value?.data?.success_count === 1

          return {
            ok,
            recipient: result.value?.recipient,
            errors: result.value?.data?.errors,
            ...(ok ? { messageId: result.value?.messageId } : {}),
          }
        }),
    }
  }
}
