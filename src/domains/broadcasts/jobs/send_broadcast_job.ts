import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'

import { BroadcastsQueue } from '@/domains/shared/queue/queue.ts'
import {
  broadcasts,
  contacts,
  sends,
} from '@/infrastructure/database/schema/schema.ts'
import { and, count, eq, sql } from 'drizzle-orm'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.ts'

import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.ts'
import { container } from '@/utils/typi.ts'

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
        team: {
          with: {
            mailer: true,
          },
        },
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
        sql`${contacts.id} = ${sends.contactId} AND ${sends.broadcastId} = ${broadcast.id}`,
      )
      .where(
        and(
          eq(contacts.audienceId, broadcast.audience.id),
          // in the case of segments, spread conditions here based on segment passed in by user.
          sql`${sends.id} IS NULL`,
        ),
      )
      .execute()

    const maximumMailsPerSecond =
      container
        .make(MailerRepository)
        .getDecryptedConfiguration(
          broadcast.team.mailer.configuration,
          broadcast.team.configurationKey,
        )?.maximumMailsPerSecond ?? 1

    // EACH BATCH SENDS A MAXIMUM OF 1 EMAIL PER SECOND AND A HALF. SO IF WE ONLY HAVE 1 EMAIL PER SECOND QUOTA, THEN WE USE ONLY ONE BATCH. IF WE HAVE 14 EMAILS PER SECOND QUOTA, THEN WE USE 14 BATCHES.
    const totalBatches = maximumMailsPerSecond

    const batchSize = 50

    for (let batch = 0; batch <= totalBatches; batch++) {
      const contactIds = await database
        .select({ id: contacts.id })
        .from(contacts)
        .leftJoin(
          sends,
          sql`${contacts.id} = ${sends.contactId} AND ${sends.broadcastId} = ${broadcast.id}`,
        )
        .where(
          and(
            eq(contacts.audienceId, broadcast.audience.id),
            // in the case of segments, spread conditions here based on segment passed in by user.
            sql`${sends.id} IS NULL`,
          ),
        )
        .limit(batchSize)
        .offset(batch * batchSize)

      await BroadcastsQueue.addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: { contactId: contact.id, broadcastId: broadcast.id },
        })),
      )
    }

    return this.done()
  }
}
