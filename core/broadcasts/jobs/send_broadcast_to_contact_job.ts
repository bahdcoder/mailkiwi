import { appEnv } from '#root/core/app/env/app_env.js'
import { InjectEmailAction } from '#root/core/injector/actions/inject_email_action.js'
import type { InjectEmailSchemaDto } from '#root/core/injector/dto/inject_email_dto.js'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import type {
  BroadcastWithEmailContent,
  SenderIdentityWithSendingDomain,
  SendingDomain,
} from '#root/database/database_schema_types.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface SendBroadcastToContactPayload {
  broadcastId: string
  contactId: string
}

/**
 * SendBroadcastToContact is responsible for sending a single marketing email to an individual contact.
 *
 * This job is a critical component in Kibamail's email marketing infrastructure. It's created in bulk
 * by the SendBroadcastJob for each recipient in a marketing campaign. The job handles:
 *
 * 1. Retrieving the contact and broadcast data
 * 2. Determining the appropriate sending domain and tracking settings
 * 3. Preparing the email with proper headers for tracking and analytics
 * 4. Injecting the email into the MTA (Mail Transfer Agent) for delivery
 *
 * The system uses custom headers (X-Kibamail-*) to track emails through the entire delivery pipeline,
 * enabling comprehensive analytics and event tracking. These headers connect email events back to
 * specific contacts, broadcasts, and audiences.
 */
export class SendBroadcastToContact extends BaseJob<SendBroadcastToContactPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST_TO_CONTACTS'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  /**
   * Processes a single email send to a specific contact as part of a broadcast campaign.
   *
   * This method implements a sophisticated email preparation workflow that:
   * 1. Retrieves the contact and broadcast data with their associated content
   * 2. Determines the appropriate sending domain using a fallback hierarchy:
   *    - First tries the broadcast's specified sending domain
   *    - Then looks for any domain configured for the 'engage' product
   *    - Finally falls back to the first available sending domain
   * 3. Applies tracking settings based on both domain and broadcast-level configurations
   * 4. Prepares the email with proper headers for tracking and analytics
   *
   * The tracking headers enable the system to connect email events (opens, clicks, bounces)
   * back to specific contacts and broadcasts, powering the analytics and automation features.
   */
  async handle({ payload }: JobContext<SendBroadcastToContactPayload>) {
    const contactRepository = container.make(ContactRepository)
    const broadcastRepository = container.make(BroadcastRepository)

    const [contact, broadcast] = await Promise.all([
      contactRepository.findById(payload.contactId),
      broadcastRepository.findByIdWithAbTestVariants(payload.broadcastId),
    ])

    if (!broadcast || !contact) {
      return this.fail('Broadcast or contact not found.')
    }

    const broadcastWithContent = broadcast as unknown as BroadcastWithEmailContent

    const { emailContent } = broadcastWithContent

    let sendingDomain: SendingDomain | undefined
    let senderIdentity: SenderIdentityWithSendingDomain | undefined

    if (broadcast.senderIdentityId) {
      senderIdentity = await container
        .make(SenderIdentityRepository)
        .findById(broadcast.senderIdentityId)

      if (senderIdentity) {
        sendingDomain = await container
          .make(SendingDomainRepository)
          .findById(senderIdentity.sendingDomainId)
      }
    }

    if (!sendingDomain) {
      const teamSendingDomains = await container
        .make(SendingDomainRepository)
        .findAllForTeam(broadcast.teamId)

      sendingDomain =
        teamSendingDomains.find(
          (sendingDomain) => broadcast.sendingDomainId === sendingDomain.id,
        ) ||
        teamSendingDomains.find((sendingDomain) => sendingDomain.product === 'engage') ||
        teamSendingDomains?.[0]
    }

    let openTrackingEnabled = sendingDomain.openTrackingEnabled ?? false
    let clickTrackingEnabled = sendingDomain.clickTrackingEnabled ?? false

    if (broadcast.trackClicks !== null) {
      clickTrackingEnabled = broadcast.trackClicks
    }

    if (broadcast.trackOpens !== null) {
      openTrackingEnabled = broadcast.trackOpens
    }

    const injectEmailPayload: InjectEmailSchemaDto = {
      from: {
        name: senderIdentity?.name || '',
        email: senderIdentity
          ? `${senderIdentity.email}@${sendingDomain.name}`
          : `noreply@${sendingDomain.name}`,
      },
      replyTo: {
        name: senderIdentity?.name || '',
        email: senderIdentity?.replyToEmail || `noreply@${sendingDomain.name}`,
      },
      recipients: [
        {
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          email: contact.email,
        },
      ],
      html: emailContent.contentHtml,
      text: emailContent.contentText,
      attachments: [],
      headers: {
        [appEnv.emailHeaders.broadcastId]: broadcast.id,
        [appEnv.emailHeaders.contactId]: contact.id,
      },
      subject: emailContent.subject,
      openTrackingEnabled,
      clickTrackingEnabled,
    }

    const { messages } = await container
      .make(InjectEmailAction)
      .handle(injectEmailPayload, sendingDomain)

    return this.done(messages)
  }

  /**
   * Handles job failure scenarios.
   *
   * This method would implement error handling and recovery strategies for when
   * an individual email send fails. Potential actions might include:
   * - Logging detailed error information
   * - Recording the failure in the contact's engagement history
   * - Updating campaign metrics to reflect the failure
   * - Attempting recovery or fallback strategies
   *
   * Note: This is currently a placeholder implementation.
   */
  async failed() {
    // TODO: Implement failure handling
  }
}
