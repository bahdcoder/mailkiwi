import { asc, count } from 'drizzle-orm'
import { ContactsConcern } from '../concerns/broadcast_contacts_concern.js'
import { PickAbTestWinnerJob } from './pick_ab_test_winner_job.js'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.js'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import type { DrizzleClient } from '#root/database/client.js'
import type {
  AbTestVariant,
  BroadcastWithSegmentAndAbTestVariants,
} from '#root/database/database_schema_types.js'
import { contacts } from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { hoursToSeconds } from '#root/core/utils/dates.js'
import { container } from '#root/core/utils/typi.js'

/**
 * Payload for the SendAbTestBroadcastJob.
 *
 * This interface defines the data required to identify and process
 * an A/B test broadcast campaign for sending.
 *
 * @property broadcastId - The unique identifier of the broadcast campaign
 */
export interface SendAbTestBroadcastJobPayload {
  broadcastId: string
}

/**
 * SendAbTestBroadcastJob handles the sending of A/B test email campaigns.
 *
 * This job implements Kibamail's A/B testing system for email marketing, which allows users to:
 * 1. Create multiple variants of an email (different subject lines, content, or sender names)
 * 2. Send these variants to a sample of the audience
 * 3. Measure which variant performs better (based on opens, clicks, or conversions)
 * 4. Automatically send the winning variant to the remainder of the audience
 *
 * The A/B testing system is a critical feature for optimizing email marketing performance,
 * as it enables data-driven decisions about email content and design rather than relying
 * on intuition or assumptions.
 */
export class SendAbTestBroadcastJob extends BaseJob<SendAbTestBroadcastJobPayload> {
  static get id() {
    return 'BROADCASTS::SEND_AB_TEST_BROADCAST'
  }

  static get queue() {
    return AVAILABLE_QUEUES.abtests_broadcasts
  }

  private database: DrizzleClient
  private broadcast: BroadcastWithSegmentAndAbTestVariants

  private contactsConcern = container.make(ContactsConcern)

  /**
   * Calculates the size and offset ranges for each A/B test variant.
   *
   * This method implements the statistical sampling logic for A/B testing:
   * 1. For each variant, calculates how many contacts should receive it based on its weight
   * 2. Determines the offset ranges in the contact list for each variant
   * 3. Ensures that variants don't overlap and cover the appropriate percentage of contacts
   *
   * The weight of each variant determines what percentage of the sample group receives that variant.
   * For example, with two variants of weight 50 each, half the sample would receive variant A and
   * half would receive variant B.
   *
   * @param totalContacts - The total number of contacts in the audience
   * @returns Array of variants with calculated size and offset information
   */
  private calculateVariantSizesAndOffsets(totalContacts: number) {
    let currentOffset = 0

    return this.broadcast.abTestVariants.map((variant) => {
      // Calculate how many contacts should receive this variant based on its weight percentage
      const size = Math.floor((variant.weight / 100) * totalContacts)

      // Create a new object with offset information for batch processing
      const variantWithOffsetAndSize = {
        ...variant,
        offset: currentOffset, // Starting position in the contact list
        endOffset: currentOffset + size, // Ending position in the contact list
        size, // Total number of contacts for this variant
      }

      // Update the current offset for the next variant
      currentOffset += size

      return variantWithOffsetAndSize
    })
  }

  /**
   * Dispatches email sending jobs for a specific A/B test variant.
   *
   * This method handles the batch processing of contacts for a single variant:
   * 1. Calculates how many batches are needed based on the variant size
   * 2. For each batch, retrieves the appropriate contacts from the database
   * 3. Creates individual email sending jobs for each contact
   * 4. Includes variant-specific information in the job data for tracking
   *
   * The batching approach is crucial for handling large audiences efficiently, as it:
   * - Prevents memory exhaustion when processing large contact lists
   * - Enables progressive sending and better error handling
   * - Allows for monitoring progress during the sending process
   *
   * @param variant - The A/B test variant with offset and size information
   */
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
      // Calculate the offset and limit for this batch to retrieve the right contacts
      const offSet = variant.offset + batch * this.batchSize
      const amountLeft = variant.endOffset - offSet
      const limit = Math.min(this.batchSize, amountLeft)

      // Get the contact IDs for this batch from the database
      const contactIds = await this.contactsConcern.getContactIds(offSet, limit)

      // Queue individual email send jobs for each contact in the batch
      // Include variant-specific information for tracking and content selection
      await Queue.broadcasts().addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: this.broadcast.id,
            abTestVariantId: variant.id, // Track which variant this contact receives
            emailContentId: variant.emailContentId, // Use the variant-specific email content
          },
          opts: { attempts: 3 },
        })),
      )
    }
  }

  async handle({ database, payload }: JobContext<SendAbTestBroadcastJobPayload>) {
    this.database = database

    this.broadcast = await this.getBroadcast(payload.broadcastId)
    this.contactsConcern.broadcast = this.broadcast
    this.contactsConcern.database = database

    if (!this.broadcast || !this.broadcast.audience) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const totalContacts = await this.getTotalContacts()

    const variantsWithOffsetsAndLimits =
      this.calculateVariantSizesAndOffsets(totalContacts)

    for (const variant of variantsWithOffsetsAndLimits) {
      await this.dispatchVariantSending(variant)
    }

    const finalSampleSize =
      totalContacts -
      variantsWithOffsetsAndLimits.reduce((total, variant) => total + variant.size, 0)

    const finalSampleOffset =
      variantsWithOffsetsAndLimits[variantsWithOffsetsAndLimits.length - 1]?.endOffset

    await this.dispatchFinalSampleSending(finalSampleSize, finalSampleOffset)

    await this.schedulePickWinnerJob()

    return this.done()
  }

  private async getBroadcast(broadcastId: string) {
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

  private async dispatchFinalSampleSending(size: number, startingOffset: number) {
    const totalBatchesForFinalSample = Math.ceil(size / this.batchSize)

    const pickWinnerJobDelay = hoursToSeconds(this.broadcast.waitingTimeToPickWinner ?? 4)
    const sendToRestOfListDelay = pickWinnerJobDelay + 3 * 60 // 3 minutes after picking winner.

    for (let batch = 0; batch < totalBatchesForFinalSample; batch++) {
      const offSet = startingOffset + batch * this.batchSize

      const contactIds = await this.contactsConcern.getContactIds(offSet, this.batchSize)

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

  /**
   * Schedules a job to automatically select the winning A/B test variant.
   *
   * This method implements the automated winner selection process:
   * 1. Calculates the appropriate delay based on the configured waiting time
   * 2. Schedules a job to run after that delay to analyze results and pick a winner
   * 3. The winner will be determined based on open rates, click rates, or other metrics
   *
   * The waiting period is crucial for collecting enough data to make a statistically
   * significant decision about which variant performed better. The default is 4 hours,
   * but users can configure this based on their typical engagement timelines.
   *
   * After the winner is selected, the system will automatically send that variant
   * to the remainder of the audience that wasn't part of the initial test group.
   */
  private async schedulePickWinnerJob() {
    // Calculate the delay before picking a winner (default: 4 hours)
    // This waiting period allows time to collect engagement metrics on the variants
    const pickWinnerJobDelay = hoursToSeconds(this.broadcast.waitingTimeToPickWinner ?? 4)

    // Schedule the job to run after the specified delay
    await Queue.abTestsBroadcasts().add(
      PickAbTestWinnerJob.id,
      { broadcastId: this.broadcast.id },
      { delay: pickWinnerJobDelay },
    )
  }

  /**
   * Handles job failure scenarios.
   *
   * This method would implement error handling and recovery strategies for when
   * the A/B test broadcast processing fails. Potential actions might include:
   * - Logging detailed error information
   * - Notifying administrators
   * - Updating the broadcast status to reflect the failure
   * - Attempting recovery or fallback strategies
   *
   * Note: This is currently a placeholder implementation.
   */
  async failed() {
    // TODO: Implement failure handling
  }
}
