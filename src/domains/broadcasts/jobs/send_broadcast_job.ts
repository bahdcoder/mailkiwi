import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'

import { and, count, eq, sql } from 'drizzle-orm'
import {
  broadcasts,
  contacts,
  sends,
} from '@/infrastructure/database/schema/schema.ts'
import { Queue } from '@/domains/shared/queue/queue.ts'
import { SendBroadcastToContacts } from './send_broadcast_to_contacts_job.ts'

export interface SendBroadcastJobPayload {
  broadcastId: string
}

export class SendBroadcastJob extends BaseJob<SendBroadcastJobPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  async handle({ database, payload }: JobContext<SendBroadcastJobPayload>) {
    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, payload.broadcastId),
      with: {
        team: true,
        audience: true,
      },
    })

    if (!broadcast || !broadcast.audience || !broadcast.team) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const [{ count: totalContacts }] = await database
      .select({ count: count() })
      .from(contacts)
      .leftJoin(
        sends,
        sql`${contacts.id} = ${sends.contactId} AND ${sends.broadcastId} IS NOT NULL`,
      )
      .where(
        and(
          eq(contacts.audienceId, broadcast.audience.id),
          sql`${sends.id} IS NULL`,
        ),
      )
      .execute()

    const batchSize = 100

    // 327, => 4 batches
    // 11 -> 1 batch
    // 4523 -> 46 batches
    const totalBatches = Math.ceil(totalContacts / batchSize)

    for (let batch = 0; batch <= totalBatches; batch++) {
      const contactIds = await database
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.audienceId, broadcast.audience.id))
        .limit(batchSize)
        .offset(batch * batchSize)

      await Queue.dispatch(SendBroadcastToContacts, {
        contactsIds: contactIds.map((contact) => contact.id),
        broadcastId: broadcast.id,
      })
    }

    return this.done()
  }
}
