import { Ignitor } from "@/api/ignitor/ignitor_api.js"
import { SendTransactionalEmailJob } from "@/transactional/jobs/send_transactional_email_job.js"
import { type Job, Worker } from "bullmq"

import { SendBroadcastJob } from "@/broadcasts/jobs/send_broadcast_job.js"
import { SendBroadcastToContact } from "@/broadcasts/jobs/send_broadcast_to_contact_job.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import type { BaseJob } from "@/shared/queue/abstract_job.js"

import { container } from "@/utils/typi.js"

export class WorkerIgnitor extends Ignitor {
  private workers: Worker<any, any, string>[] = []
  private jobs: Map<string, new () => BaseJob<object>> = new Map()

  async start() {
    await this.startDatabaseConnector()

    this.registerJobs()

    return this
  }

  registerJobs() {
    this.registerJob(SendBroadcastJob.id, SendBroadcastJob)
    this.registerJob(SendBroadcastToContact.id, SendBroadcastToContact)
    this.registerJob(
      SendTransactionalEmailJob.id,
      SendTransactionalEmailJob,
    )
  }

  private registerJob(id: string, job: new () => BaseJob<object>) {
    this.jobs.set(id, job)

    return this
  }

  private async processJob(job: Job) {
    const Executor = this.jobs.get(job.name)

    if (!Executor) {
      d(["No handler defined for job name:", job.name])

      return
    }

    const executor = container.make(Executor)

    const ctx = {
      payload: job.data,
      redis: makeRedis(),
      database: makeDatabase(),
    }

    try {
      const response = await executor.handle(ctx)

      if (!response.success) {
        throw new Error("Job processing failed.")
      }
    } catch (error) {
      if (job.attemptsMade >= (job?.opts?.attempts ?? 1)) {
        await executor?.failed(ctx)
      }

      throw error
    }
  }

  listen(queueNames: string[]) {
    for (const [idx, queue] of queueNames.entries()) {
      this.workers[idx] = new Worker(
        queue,
        async (job) => this.processJob(job),
        {
          connection: makeRedis(),
        },
      )

      this.workers[idx].on("completed", function jobCompleted(job) {
        d(["Completed:", job.id, job.data])
      })

      this.workers[idx].on("failed", function jobFailed(job, error) {
        d(["Failed:", job?.id, job?.data, error?.message, error])
      })
    }

    d(`Queue listening for jobs on queues: ${queueNames.join(", ")}`)
  }

  async shutdown() {
    await super.shutdown()

    for (const worker of this.workers) {
      await worker.close()
    }
  }
}
