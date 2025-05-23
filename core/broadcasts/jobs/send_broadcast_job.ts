import { type SQLWrapper, and, eq } from 'drizzle-orm'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.js'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import { broadcasts, contacts } from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

/**
 * Payload for the SendBroadcastJob.
 *
 * This interface defines the data required to identify and process
 * a broadcast campaign for sending.
 *
 * @property broadcastId - The unique identifier of the broadcast campaign
 */
export interface SendBroadcastJobPayload {
  broadcastId: string
}

/**
 * SendBroadcastJob is responsible for initiating the sending of a marketing email campaign.
 *
 * This job is the entry point for Kibamail's email broadcast system, handling the process of:
 * 1. Retrieving the broadcast configuration and content
 * 2. Applying audience segmentation rules to target specific contacts
 * 3. Breaking the recipient list into manageable batches
 * 4. Queuing individual email sends for each recipient
 *
 * The job implements a distributed processing pattern where it doesn't send emails directly,
 * but rather creates individual jobs for each recipient. This approach provides several benefits:
 * - Horizontal scalability for handling large campaigns
 * - Fault tolerance through job retries
 * - Better monitoring and tracking of individual email sends
 * - Rate limiting and throttling capabilities
 */
export class SendBroadcastJob extends BaseJob<SendBroadcastJobPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  /**
   * Processes a broadcast campaign by queuing individual email sends for each recipient.
   *
   * This method implements the core broadcast sending logic:
   * 1. Retrieves the broadcast configuration with its content and A/B test variants
   * 2. Applies segmentation rules to filter the audience if specified
   * 3. Retrieves contacts in batches to avoid memory issues with large audiences
   * 4. Creates individual SendBroadcastToContact jobs for each recipient
   *
   * The batching approach is crucial for handling large audiences efficiently, as it:
   * - Prevents memory exhaustion when processing large contact lists
   * - Enables progressive sending and better error handling
   * - Allows for monitoring progress during the sending process
   *
   * @param context - The job context containing the database connection and payload
   * @returns Success or failure status
   */
  async handle({ database, payload }: JobContext<SendBroadcastJobPayload>) {
    const broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(payload.broadcastId)

    if (!broadcast || !broadcast.audienceId) {
      return this.fail('Broadcast or audience or team not properly provided.')
    }

    const audience = await container
      .make(AudienceRepository)
      .findById(broadcast.audienceId)

    const segmentQueryConditions: SQLWrapper[] = []

    if (broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(broadcast.segment.filterGroups, audience).build(),
      )
    }

    const batchSize = 75
    const totalBatches = 1

    for (let batch = 0; batch <= totalBatches; batch++) {
      const contactIds = await database
        .select({ id: contacts.id })
        .from(contacts)
        .where(
          and(eq(contacts.audienceId, broadcast.audienceId), ...segmentQueryConditions),
        )
        .limit(batchSize)
        .offset(batch * batchSize)

      await Queue.broadcasts().addBulk(
        contactIds.map((contact) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: broadcast.id,
          },
          opts: {
            attempts: 3,
          },
        })),
      )
    }

    return this.done()
  }

  /**
   * Handles job failure scenarios.
   *
   * This method would implement error handling and recovery strategies for when
   * the broadcast processing fails. Potential actions might include:
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
