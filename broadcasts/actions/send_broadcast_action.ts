import { Job } from "bullmq"

import { SendAbTestBroadcastJob } from "@/broadcasts/jobs/send_ab_test_broadcast_job.js"
import { SendBroadcastJob } from "@/broadcasts/jobs/send_broadcast_job.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import type { BroadcastWithoutContent } from "@/database/database_schema_types.js"

import { BroadcastsQueue, Queue } from "@/shared/queue/queue.js"

import { differenceInSeconds } from "@/utils/dates.js"
import { container } from "@/utils/typi.js"

export class SendBroadcastAction {
  constructor(private broadcastRepository = container.make(BroadcastRepository)) {}

  async handle(broadcast: BroadcastWithoutContent) {
    if (broadcast.isAbTest) {
      await Queue.abTestsBroadcasts().add(
        SendAbTestBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          delay: broadcast.sendAt ? differenceInSeconds(new Date(), broadcast.sendAt) : 0,
        },
      )
    }

    if (!broadcast.isAbTest) {
      const jobId = `SEND_BROADCAST_${broadcast.id}`
      const existingJob: Job = await Queue.broadcasts().getJob(jobId)

      if (existingJob) {
        await existingJob.remove()
      }

      await Queue.broadcasts().add(
        SendBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          delay: broadcast.sendAt ? differenceInSeconds(new Date(), broadcast.sendAt) : 0,
          jobId,
        },
      )
    }

    await this.broadcastRepository.update(broadcast.id, {
      status: "QUEUED_FOR_SENDING",
    })
  }
}
