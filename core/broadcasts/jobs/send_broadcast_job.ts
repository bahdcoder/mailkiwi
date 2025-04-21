import { type SQLWrapper, and, eq } from 'drizzle-orm'
import { SendBroadcastToContact } from './send_broadcast_to_contact_job.js'

import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.js'

import { broadcasts, contacts } from '@/database/schema.js'

import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'
import { Queue } from '@/shared/queue/queue.js'

import { container } from '@/utils/typi.js'

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

    // Build query conditions for audience segmentation if specified in the broadcast
    // Segmentation allows targeting specific subsets of the audience based on properties,
    // behaviors, or engagement metrics (e.g., "Contacts who opened an email in the last 30 days")
    const segmentQueryConditions: SQLWrapper[] = []

    if (broadcast.segment) {
      // Use the SegmentBuilder to convert the declarative segment definition into SQL conditions
      // This leverages the same powerful segmentation engine used throughout the platform
      segmentQueryConditions.push(
        new SegmentBuilder(broadcast.segment.filterGroups, audience).build(),
      )
    }

    // Configure batch processing parameters for handling large contact lists efficiently
    // Batching is crucial for performance and reliability when sending to large audiences
    const batchSize = 75 // Number of contacts to process in each batch
    const totalBatches = 1 // For testing/development; in production would be calculated based on audience size

    // Process contacts in batches and queue individual email sends for each recipient
    // This distributed approach allows for horizontal scaling and better error handling
    for (let batch = 0; batch <= totalBatches; batch++) {
      // Retrieve a batch of contacts that match both the audience and segment criteria
      // Using limit and offset for pagination to handle large datasets efficiently
      const contactIds = await database
        .select({ id: contacts.id })
        .from(contacts)
        .where(
          and(eq(contacts.audienceId, broadcast.audienceId), ...segmentQueryConditions),
        )
        .limit(batchSize)
        .offset(batch * batchSize)

      // Queue individual email send jobs for each contact in the batch
      // Using BullMQ's addBulk for efficient job creation with minimal database operations
      await Queue.broadcasts().addBulk(
        contactIds.map((contact, idx) => ({
          name: SendBroadcastToContact.id,
          data: {
            contactId: contact.id,
            broadcastId: broadcast.id,
          },
          opts: {
            attempts: 3, // Retry failed sends up to 3 times for better delivery reliability
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
