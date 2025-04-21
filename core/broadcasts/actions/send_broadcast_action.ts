import type { Job } from 'bullmq'

import { SendAbTestBroadcastJob } from '@/broadcasts/jobs/send_ab_test_broadcast_job.js'
import { SendBroadcastJob } from '@/broadcasts/jobs/send_broadcast_job.js'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

import type { BroadcastWithoutContent } from '@/database/database_schema_types.js'

import { BroadcastsQueue, Queue } from '@/shared/queue/queue.js'

import { differenceInSeconds } from '@/utils/dates.js'
import { container } from '@/utils/typi.js'

/**
 * SendBroadcastAction handles the scheduling and queuing of email broadcasts.
 *
 * This action is responsible for initiating the email sending process for both
 * regular broadcasts and A/B test campaigns. It implements the core scheduling logic by:
 *
 * 1. Determining the appropriate job type based on broadcast configuration (A/B test or regular)
 * 2. Calculating the delay for scheduled broadcasts
 * 3. Handling job deduplication to prevent duplicate sends
 * 4. Updating the broadcast status to reflect the queued state
 *
 * The action serves as the entry point for the email sending workflow, which continues
 * through a series of background jobs that handle the actual email preparation and delivery.
 */
export class SendBroadcastAction {
  constructor(private broadcastRepository = container.make(BroadcastRepository)) {}

  /**
   * Schedules a broadcast for sending, either immediately or at a future time.
   *
   * This method implements the broadcast scheduling logic:
   * 1. For A/B test broadcasts, queues a SendAbTestBroadcastJob
   * 2. For regular broadcasts, queues a SendBroadcastJob with deduplication
   * 3. Updates the broadcast status to reflect the queued state
   *
   * The method handles scheduled broadcasts by calculating the appropriate delay
   * based on the broadcast's sendAt timestamp. This enables features like:
   * - Scheduling campaigns for optimal sending times
   * - Preparing campaigns in advance of sending
   * - Timezone-aware campaign scheduling
   *
   * For regular broadcasts, the method implements job deduplication by using a
   * consistent job ID and removing any existing job with the same ID. This prevents
   * duplicate sends if the action is called multiple times for the same broadcast.
   *
   * @param broadcast - The broadcast to schedule for sending
   */
  async handle(broadcast: BroadcastWithoutContent) {
    // Handle A/B test broadcasts
    if (broadcast.isAbTest) {
      await Queue.abTestsBroadcasts().add(
        SendAbTestBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          // Calculate delay for scheduled broadcasts
          delay: broadcast.sendAt ? differenceInSeconds(new Date(), broadcast.sendAt) : 0,
        },
      )
    }

    // Handle regular broadcasts
    if (!broadcast.isAbTest) {
      // Create a consistent job ID for deduplication
      const jobId = `SEND_BROADCAST_${broadcast.id}`

      // Check if a job already exists for this broadcast
      const existingJob: Job = await Queue.broadcasts().getJob(jobId)

      // Remove the existing job to prevent duplicate sends
      if (existingJob) {
        await existingJob.remove()
      }

      // Queue a new job for sending the broadcast
      await Queue.broadcasts().add(
        SendBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          // Calculate delay for scheduled broadcasts
          delay: broadcast.sendAt ? differenceInSeconds(new Date(), broadcast.sendAt) : 0,
          // Use consistent job ID for deduplication
          jobId,
        },
      )
    }

    // Update the broadcast status to reflect the queued state
    await this.broadcastRepository.update(broadcast.id, {
      status: 'QUEUED_FOR_SENDING',
    })
  }
}
