import { Mailer } from '@/domains/shared/mailers/mailer.ts'
import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'
import type { DrizzleClient } from '@/infrastructure/database/client.ts'
import {
  broadcasts,
  contacts as contactsTable,
  sends,
} from '@/infrastructure/database/schema/schema.ts'
import type {
  Broadcast,
  Contact,
} from '@/infrastructure/database/schema/types.ts'
import { sleep } from '@/utils/sleep.ts'
import { eq, inArray } from 'drizzle-orm'

export interface SendBroadcastToContactsPayload {
  broadcastId: string
  contactsIds: string[]
}

export class SendBroadcastToContacts extends BaseJob<SendBroadcastToContactsPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST_TO_CONTACTS'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  private async sendEmailToContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
  ) {
    d({ 'Sending email to:': contact.email })

    const [response, error] = await Mailer.from(
      contact.email,
      `${contact.firstName} ${contact.lastName}`,
    )
      .subject('Welcome to our newsletter.')
      .to(contact.email, `${contact.firstName} ${contact.lastName}`)
      .content(broadcast.contentHtml as string, broadcast.contentText as string)
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

  async markAsFailedToSendToContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
    error: Error,
  ) {
    d({ [`Failed to send to contact: ${contact.email}`]: error })
    await database.insert(sends).values({
      contactId: contact.id,
      broadcastId: broadcast.id,
      status: 'FAILED',
      type: 'BROADCAST',
      logs: JSON.stringify(error.message),
    })
  }

  async markAsSentToContact(
    contact: Contact,
    broadcast: Broadcast,
    database: DrizzleClient,
    messageId: string,
  ) {
    await database.insert(sends).values({
      contactId: contact.id,
      broadcastId: broadcast.id,
      status: 'SENT',
      type: 'BROADCAST',
      sentAt: new Date(),
      messageId,
    })
  }

  async handle({
    database,
    payload,
  }: JobContext<SendBroadcastToContactsPayload>) {
    const contacts = await database.query.contacts.findMany({
      where: inArray(contactsTable.id, payload.contactsIds),
    })

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, payload.broadcastId),
    })

    if (!broadcast) {
      return this.fail('Broadcast not found.')
    }

    await this.processPromises(
      contacts.map((contact) => [
        async () => this.sendEmailToContact(contact, broadcast, database),
        async (error) =>
          this.markAsFailedToSendToContact(contact, broadcast, database, error),
      ]),
      1, // send 3 emails at a time. this number will depend on the rate limit set on AWS.
    )

    return { success: true, output: 'Success' }
  }
}
