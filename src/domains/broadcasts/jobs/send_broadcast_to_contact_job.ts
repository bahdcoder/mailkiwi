import { Mailer } from '@/domains/shared/mailers/mailer.js'
import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.js'
import { cuid } from '@/domains/shared/utils/cuid/cuid.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import {
  broadcasts,
  contacts as contactsTable,
  sends,
} from '@/infrastructure/database/schema/schema.js'
import type {
  Broadcast,
  BroadcastWithEmailContent,
  Contact,
} from '@/infrastructure/database/schema/types.js'
import { addSecondsToDate } from '@/utils/dates.js'
import { and, eq } from 'drizzle-orm'
import { safeParseAsync } from 'valibot'
import { SendBroadcastSchema } from '../dto/send_broadcast_dto.ts'

export interface SendBroadcastToContactPayload {
  broadcastId: string
  contactId: string
}

export class SendBroadcastToContact extends BaseJob<SendBroadcastToContactPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST_TO_CONTACTS'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  private async sendEmailToContact(
    contact: Contact,
    broadcast: BroadcastWithEmailContent,
    database: DrizzleClient,
  ) {
    d({ 'Sending email to:': contact.email })

    await this.createSendForContact(contact, broadcast, database)

    const [response, error] = await Mailer.from(
      broadcast.emailContent.fromEmail,
      `${broadcast.emailContent.fromName}`,
    )
      .subject(broadcast.emailContent.subject)
      .to(contact.email, `${contact.firstName} ${contact.lastName}`)
      .content(
        broadcast.emailContent.contentHtml,
        broadcast.emailContent.contentText,
      )
      .send()

    if (error) {
      d({ [`Failed to send to contact: ${contact.email}`]: error })
      await this.markAsFailedToSendToContact(
        contact,
        broadcast,
        database,
        error,
      )

      return
    }

    await this.markAsSentToContact(
      contact,
      broadcast,
      database,
      response.messageId,
    )
  }

  async createSendForContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
  ) {
    const id = cuid()

    await database
      .insert(sends)
      .values({
        id,
        contactId: contact.id,
        broadcastId: broadcast.id,
        status: 'PENDING',
        type: 'BROADCAST',
        timeoutAt: addSecondsToDate(new Date(), 25),
      })
      .execute()

    return { id }
  }

  async markAsFailedToSendToContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
    error: Error,
  ) {
    await database
      .update(sends)
      .set({
        status: 'FAILED',
        type: 'BROADCAST',
        logs: JSON.stringify(error.message),
      })
      .where(
        and(
          and(
            eq(sends.contactId, contact.id),
            eq(sends.broadcastId, broadcast.id),
          ),
        ),
      )
  }

  async markAsSentToContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
    messageId: string,
  ) {
    d({ messageId, id: contact.id })
    await database
      .update(sends)
      .set({
        status: 'SENT',
        messageId,
        sentAt: new Date(),
      })
      .where(
        and(
          eq(sends.contactId, contact.id),
          eq(sends.broadcastId, broadcast.id),
        ),
      )
  }

  async handle({
    database,
    payload,
  }: JobContext<SendBroadcastToContactPayload>) {
    const contact = await database.query.contacts.findFirst({
      where: eq(contactsTable.id, payload.contactId),
    })

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, payload.broadcastId),
      with: {
        emailContent: true,
      },
    })

    if (!broadcast || !contact) {
      return this.fail('Broadcast or contact not found.')
    }

    try {
      await this.sendEmailToContact(
        contact,
        broadcast as BroadcastWithEmailContent,
        database,
      )
    } catch (error) {
      await this.markAsFailedToSendToContact(
        contact,
        broadcast,
        database,
        error as Error,
      )
    }

    return { success: true, output: 'Success' }
  }
}
