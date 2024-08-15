import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'
import {
  AbTestsBroadcastsQueue,
  BroadcastsQueue,
} from '@/shared/queue/queue.js'
import {
  abTestVariants,
  broadcasts,
  contacts,
  sends,
} from '@/database/schema/schema.js'
import {
  and,
  asc,
  count,
  eq,
  type SQL,
  sql,
  type SQLWrapper,
} from 'drizzle-orm'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.js'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.ts'
import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.ts'
import { PickAbTestWinnerJob } from './pick_ab_test_winner_job.ts'
import { hoursToSeconds } from '@/utils/dates.ts'
import type {
  AbTestVariant,
  BroadcastWithSegmentAndAbTestVariants,
} from '@/database/schema/types.ts'
import type { DrizzleClient } from '@/database/client.js'

export interface SendAbTestBroadcastJobPayload {
  broadcastId: string
}

export class SendAbTestBroadcastJob extends BaseJob<SendAbTestBroadcastJobPayload> {
  static get id() {
    return 'BROADCASTS::SEND_AB_TEST_BROADCAST'
  }

  static get queue() {
    return AVAILABLE_QUEUES.abtests_broadcasts
  }

  private database: DrizzleClient
  private broadcast: BroadcastWithSegmentAndAbTestVariants

  private leftJoinSends = (broadcastId: string) =>
    sql`${contacts.id} = ${sends.contactId} AND ${sends.broadcastId} = ${broadcastId}`

  private filterContactsQuery(): SQL | undefined {
    const segmentQueryConditions: SQLWrapper[] = []

    if (this.broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(
          this.broadcast.segment.conditions as CreateSegmentDto['conditions'],
        ).build(),
      )
    }

    return and(
      eq(contacts.audienceId, this.broadcast.audience.id),
      ...segmentQueryConditions,
      sql`${sends.id} IS NULL`,
    )
  }

  private calculateVariantSizesAndOffsets(totalContacts: number) {
    let currentOffset = 0

    return this.broadcast.abTestVariants.map((variant) => {
      const size = Math.floor((variant.weight / 100) * totalContacts)

      const variantWithOffsetAndSize = {
        ...variant,
        offset: currentOffset,
        endOffset: currentOffset + size,
        size,
      }
      currentOffset += size

      return variantWithOffsetAndSize
    })
  }

  private async dispatchVariantSending(
    variant: AbTestVariant & {
      offset: number
      endOffset: number
      size: number
    },
  ) {
    const totalContactsForVariant = variant.size
    const totalBatches = Math.ceil(totalContactsForVariant / this.batchSize)

    for (let batch = 0; batch < totalBatches; batch++) {
      const offSet = variant.offset + batch * this.batchSize
      const amountLeft = variant.endOffset - offSet
      const limit = Math.min(this.batchSize, amountLeft)

      const contactIds = await this.getContactIds(offSet, limit)

      await BroadcastsQueue.addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: this.broadcast.id,
            abTestVariantId: variant.id,
            emailContentId: variant.emailContentId,
          },
          opts: { attempts: 3 },
        })),
      )
    }
  }

  private async getContactIds(offSet: number, limit: number) {
    return this.database
      .select({ id: contacts.id })
      .from(contacts)
      .leftJoin(sends, this.leftJoinSends(this.broadcast.id))
      .where(this.filterContactsQuery())
      .orderBy(asc(contacts.id))
      .limit(limit)
      .offset(offSet)
  }

  async handle({
    database,
    payload,
  }: JobContext<SendAbTestBroadcastJobPayload>) {
    this.database = database

    this.broadcast = await this.getBroadcast(payload.broadcastId)

    if (!this.broadcast || !this.broadcast.audience || !this.broadcast.team) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const totalContacts = await this.getTotalContacts()
    const batchSize = 75

    const variantsWithOffsetsAndLimits =
      this.calculateVariantSizesAndOffsets(totalContacts)

    for (const variant of variantsWithOffsetsAndLimits) {
      await this.dispatchVariantSending(variant)
    }

    const finalSampleSize =
      totalContacts -
      variantsWithOffsetsAndLimits.reduce(
        (total, variant) => total + variant.size,
        0,
      )

    const finalSampleOffset =
      variantsWithOffsetsAndLimits[variantsWithOffsetsAndLimits.length - 1]
        ?.endOffset

    await this.dispatchFinalSampleSending(finalSampleSize, finalSampleOffset)

    await this.schedulePickWinnerJob()

    return this.done()
  }

  private async getBroadcast(broadcastId: string) {
    const broadcast = await this.database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
      with: {
        team: { with: { mailer: true } },
        abTestVariants: { orderBy: asc(abTestVariants.weight) },
        audience: true,
        segment: true,
      },
    })

    return broadcast as BroadcastWithSegmentAndAbTestVariants
  }

  private async getTotalContacts() {
    const [{ count: totalContacts }] = await this.database
      .select({ count: count() })
      .from(contacts)
      .leftJoin(sends, this.leftJoinSends(this.broadcast.id))
      .where(this.filterContactsQuery())
      .orderBy(asc(contacts.id))

    return totalContacts
  }

  private async dispatchFinalSampleSending(
    size: number,
    startingOffset: number,
  ) {
    const totalBatchesForFinalSample = Math.ceil(size / this.batchSize)

    const pickWinnerJobDelay = hoursToSeconds(
      this.broadcast.waitingTimeToPickWinner ?? 4,
    )
    const sendToRestOfListDelay = pickWinnerJobDelay + 3 * 60 // 3 minutes after picking winner.

    for (let batch = 0; batch < totalBatchesForFinalSample; batch++) {
      const offSet = startingOffset + batch * this.batchSize

      const contactIds = await this.getContactIds(offSet, this.batchSize)

      await BroadcastsQueue.addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: this.broadcast.id,
            isAbTestFinalSample: true,
          },
          opts: { attempts: 3, delay: sendToRestOfListDelay },
        })),
      )
    }
  }

  private async schedulePickWinnerJob() {
    const pickWinnerJobDelay = hoursToSeconds(
      this.broadcast.waitingTimeToPickWinner ?? 4,
    )
    await AbTestsBroadcastsQueue.add(
      PickAbTestWinnerJob.id,
      { broadcastId: this.broadcast.id },
      { delay: pickWinnerJobDelay },
    )
  }
}
