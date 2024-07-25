import { Mailer } from '@/domains/shared/mailers/mailer.ts'
import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'
import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'
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
import { addSecondsToDate } from '@/utils/dates.ts'
import { sleep } from '@/utils/sleep.ts'
import { eq, inArray } from 'drizzle-orm'

export interface SendBroadcastToContactsPayload {
  broadcastId: string
  contactsIds: string[]
}

export class SendBroadcastToContacts extends BaseJob<SendBroadcastToContactsPayload> {
  private MINIMUM_MILLISECONDS_PER_SEND = 1500

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

    // create send and leave it in draft

    const start = performance.now()
    const [response, error] = await Mailer.from(
      contact.email,
      `${contact.firstName} ${contact.lastName}`,
    )
      .subject('Welcome to our newsletter.')
      .to(contact.email, `${contact.firstName} ${contact.lastName}`)
      .content(broadcast.contentHtml as string, broadcast.contentText as string)
      .send()
    const end = performance.now()

    const timeElapsed = end - start

    const wait =
      this.MINIMUM_MILLISECONDS_PER_SEND > timeElapsed
        ? this.MINIMUM_MILLISECONDS_PER_SEND - timeElapsed
        : 0

    if (wait > 0) {
      await sleep(wait)
    }

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
    error: Error,
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
        timeoutAt: addSecondsToDate(new Date(), 25), // if this send has not been processed in 25 seconds, other workers will pick it up and attempt sending it.
        logs: JSON.stringify(error.message),
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
      1, // process 1 send at a time. this number will depend on the rate limit set on AWS.
    )

    return { success: true, output: 'Success' }
  }
}
