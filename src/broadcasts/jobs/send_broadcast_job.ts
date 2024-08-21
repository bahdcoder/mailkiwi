import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'

import { Queue } from '@/shared/queue/queue.js'
import { broadcasts, contacts } from '@/database/schema/schema.js'
import { and, eq, type SQLWrapper } from 'drizzle-orm'
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
        team: true,
        audience: true,
        segment: true,
      },
    })

    if (!broadcast || !broadcast.audience || !broadcast.team) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const segmentQueryConditions: SQLWrapper[] = []

    if (broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(
          broadcast.segment.conditions as CreateSegmentDto['conditions'],
        ).build(),
      )
    }

    const batchSize = 75
    const totalContacts = 0
    const totalBatches = 1

    // Here we're just blasting out all those emails.

    for (let batch = 0; batch <= totalBatches; batch++) {
      const contactIds = await database
        .select({ id: contacts.id })
        .from(contacts)
        .where(
          and(
            eq(contacts.audienceId, broadcast.audience.id),
            ...segmentQueryConditions,
          ),
        )
        .limit(batchSize)
        .offset(batch * batchSize)

      await Queue.broadcasts().addBulk(
        contactIds.map((contact, idx) => ({
          name: SendBroadcastToContact.id,
          data: { contactId: contact.id, broadcastId: broadcast.id },
          opts: {
            attempts: 3,
          },
        })),
      )
    }

    return this.done()
  }
}
