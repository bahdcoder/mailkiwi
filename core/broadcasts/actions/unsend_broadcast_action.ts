import type { Job } from 'bullmq'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import type { BroadcastWithoutContent } from '#root/database/database_schema_types.js'

import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export class UnsendBroadcastAction {
  constructor(private broadcastRepository = container.make(BroadcastRepository)) {}

  async handle(broadcast: BroadcastWithoutContent) {
    const jobId = `SEND_BROADCAST_${broadcast.id}`
    const existingJob: Job = await Queue.broadcasts().getJob(jobId)

    if (existingJob) {
      await existingJob.remove()
    }

    await this.broadcastRepository.update(broadcast.id, {
      status: 'DRAFT',
      sendAt: undefined,
    })
  }
}
