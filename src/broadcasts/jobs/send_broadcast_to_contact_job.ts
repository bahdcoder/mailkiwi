import { eq } from "drizzle-orm"

import type { BroadcastWithEmailContent } from "@/database/schema/database_schema_types.js"
import {
  broadcasts,
  contacts as contactsTable,
} from "@/database/schema/schema.js"

import { Mailer } from "@/shared/mailers/mailer.js"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

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

  async handle({
    database,
    payload,
    redis,
  }: JobContext<SendBroadcastToContactPayload>) {
    const [contact, broadcast] = await Promise.all([
      database.query.contacts.findFirst({
        where: eq(contactsTable.id, payload.contactId),
      }),
      database.query.broadcasts.findFirst({
        where: eq(broadcasts.id, payload.broadcastId),
        with: {
          emailContent: true,
        },
      }),
    ])

    if (!broadcast || !contact) {
      return this.fail("Broadcast or contact not found.")
    }

    const broadcastWithContent = broadcast as BroadcastWithEmailContent

    const [response, error] = await Mailer.from(
      broadcastWithContent.emailContent.fromEmail,
      `${broadcastWithContent.emailContent.fromName}`,
    )
      .subject(broadcastWithContent.emailContent.subject)
      .to(contact.email, `${contact.firstName} ${contact.lastName}`)
      .content(
        broadcastWithContent.emailContent.contentHtml,
        broadcastWithContent.emailContent.contentText,
      )
      .send()

    if (error) {
      return this.fail(`Failed to send to contact: ${contact.id}`)
    }

    /* After sending, set a key in redis to store the message id. */
    await redis.set(
      response.messageId,
      `BROADCAST:${broadcast.id}:${contact.id}`,
    )

    return { success: true, output: "Success." }
  }

  async failed() {}
}
