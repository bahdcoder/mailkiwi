import { appEnv } from "@/app/env/app_env.js"
import { InjectEmailAction } from "@/injector/actions/inject_email_action.js"
import { InjectEmailSchemaDto } from "@/injector/dto/inject_email_dto.js"

import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import type { BroadcastWithEmailContent } from "@/database/database_schema_types.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

import { container } from "@/utils/typi.js"

export interface SendBroadcastToContactPayload {
  broadcastId: string
  contactId: string
}

export class SendBroadcastToContact extends BaseJob<SendBroadcastToContactPayload> {
  static get id() {
    return "BROADCASTS::SEND_BROADCAST_TO_CONTACTS"
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  async handle({ payload }: JobContext<SendBroadcastToContactPayload>) {
    const contactRepository = container.make(ContactRepository)
    const broadcastRepository = container.make(BroadcastRepository)

    const [contact, broadcast] = await Promise.all([
      contactRepository.findById(payload.contactId),
      broadcastRepository.findByIdWithAbTestVariants(payload.broadcastId),
    ])

    if (!broadcast || !contact) {
      return this.fail("Broadcast or contact not found.")
    }

    const broadcastWithContent =
      broadcast as unknown as BroadcastWithEmailContent

    const { emailContent } = broadcastWithContent

    const teamSendingDomains = await container
      .make(SendingDomainRepository)
      .findAllForTeam(broadcast.teamId)

    let sendingDomain =
      teamSendingDomains.find(
        (sendingDomain) => sendingDomain.product === "engage",
      ) || teamSendingDomains?.[0]

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
        name: emailContent.fromName,
        email: emailContent.fromEmail,
      },
      replyTo: {
        name: emailContent.replyToName,
        email: emailContent.replyToEmail,
      },
      recipients: [
        {
          name: contact.firstName + " " + contact.lastName,
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

  async failed() {}
}
