import { ContactsConcern } from "../concerns/broadcast_contacts_concern.ts"
import { PickAbTestWinnerJob } from "./pick_ab_test_winner_job.ts"
import { SendBroadcastToContact } from "./send_broadcast_to_contact_job.js"
import { asc, count, eq } from "drizzle-orm"

import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.ts"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

import type { DrizzleClient } from "@/database/client.js"
import type {
  AbTestVariant,
  BroadcastWithSegmentAndAbTestVariants,
} from "@/database/schema/database_schema_types.js"
import {
  abTestVariants,
  broadcasts,
  contacts,
} from "@/database/schema/schema.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { Queue } from "@/shared/queue/queue.js"

import { hoursToSeconds } from "@/utils/dates.ts"
import { container } from "@/utils/typi.ts"

export interface SendAbTestBroadcastJobPayload {
  broadcastId: number
}

export class SendAbTestBroadcastJob extends BaseJob<SendAbTestBroadcastJobPayload> {
  static get id() {
    return "BROADCASTS::SEND_AB_TEST_BROADCAST"
  }

  static get queue() {
    return AVAILABLE_QUEUES.abtests_broadcasts
  }

  private database: DrizzleClient
  private broadcast: BroadcastWithSegmentAndAbTestVariants

  private contactsConcern = container.make(ContactsConcern)

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
    const totalBatches = Math.ceil(
      totalContactsForVariant / this.batchSize,
    )

    for (let batch = 0; batch < totalBatches; batch++) {
      const offSet = variant.offset + batch * this.batchSize
      const amountLeft = variant.endOffset - offSet
      const limit = Math.min(this.batchSize, amountLeft)

      const contactIds = await this.contactsConcern.getContactIds(
        offSet,
        limit,
      )

      await Queue.broadcasts().addBulk(
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

  async handle({
    database,
    payload,
  }: JobContext<SendAbTestBroadcastJobPayload>) {
    this.database = database

    this.broadcast = await this.getBroadcast(payload.broadcastId)
    this.contactsConcern.broadcast = this.broadcast
    this.contactsConcern.database = database

    if (!this.broadcast || !this.broadcast.audience) {
      return this.fail(
        "Broadcast or audience or team not properly provided.",
      )
    }

    const totalContacts = await this.getTotalContacts()

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

    await this.dispatchFinalSampleSending(
      finalSampleSize,
      finalSampleOffset,
    )

    await this.schedulePickWinnerJob()

    return this.done()
  }

  private async getBroadcast(broadcastId: number) {
    const broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(broadcastId)

    return broadcast as unknown as BroadcastWithSegmentAndAbTestVariants
  }

  private async getTotalContacts() {
    const [{ count: totalContacts }] = await this.database
      .select({ count: count() })
      .from(contacts)
      .where(this.contactsConcern.filterContactsQuery())
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

      const contactIds = await this.contactsConcern.getContactIds(
        offSet,
        this.batchSize,
      )

      await Queue.broadcasts().addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: this.broadcast.id,
            isAbTestFinalSample: true,
          },
          opts: {
            attempts: 3,
            delay: sendToRestOfListDelay,
          },
        })),
      )
    }
  }

  private async schedulePickWinnerJob() {
    const pickWinnerJobDelay = hoursToSeconds(
      this.broadcast.waitingTimeToPickWinner ?? 4,
    )
    await Queue.abTestsBroadcasts().add(
      PickAbTestWinnerJob.id,
      { broadcastId: this.broadcast.id },
      { delay: pickWinnerJobDelay },
    )
  }

  async failed() {}
}
