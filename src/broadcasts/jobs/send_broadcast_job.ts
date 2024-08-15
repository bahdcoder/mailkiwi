import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'

import { BroadcastsQueue } from '@/shared/queue/queue.js'
import { broadcasts, contacts, sends } from '@/database/schema/schema.js'
import { and, eq, sql, type SQLWrapper } from 'drizzle-orm'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.js'

import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.ts'
import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.ts'

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
        segment: true,
      },
    })

    if (!broadcast || !broadcast.audience || !broadcast.team) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const maximumMailsPerSecond = broadcast.team.mailer.maxSendRate ?? 1

    // queue each email x amount of seconds apart. this is to make sure we don't run into any rate limits.
    // if max send per second = 1, then queue emails 2 seconds apart.
    // if max send per second > 1, then queue emails 1 seconds apart.

    const totalBatches = maximumMailsPerSecond

    const segmentQueryConditions: SQLWrapper[] = []

    if (broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(
          broadcast.segment.conditions as CreateSegmentDto['conditions'],
        ).build(),
      )
    }

    const batchSize = 75

    // Here we're just blasting out all those emails.

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
            ...segmentQueryConditions,
            sql`${sends.id} IS NULL`,
          ),
        )
        .limit(batchSize)
        .offset(batch * batchSize)

      const speedCoefficient = maximumMailsPerSecond === 1 ? 2.5 : 1.25

      await BroadcastsQueue.addBulk(
        contactIds.map((contact, idx) => ({
          name: SendBroadcastToContact.id,
          data: { contactId: contact.id, broadcastId: broadcast.id },
          opts: {
            delay: speedCoefficient * idx * 1000,
            attempts: 3,
          }, // delay sends x seconds into the future.
        })),
      )
    }

    return this.done()
  }
}
