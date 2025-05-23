import { Ignitor } from '#root/core/app/ignitor/ignitor.js'
import { SendTransactionalEmailJob } from '#root/core/transactional/jobs/send_transactional_email_job.js'
import { type Job, Worker } from 'bullmq'

import { SendBroadcastJob } from '#root/core/broadcasts/jobs/send_broadcast_job.js'
import { SendBroadcastToContact } from '#root/core/broadcasts/jobs/send_broadcast_to_contact_job.js'

import { ImportContactsJob } from '#root/core/audiences/jobs/import_contacts_job.js'
import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import type { BaseJob, JobHandlerResponse } from '#root/core/shared/queue/abstract_job.js'
import { container } from '#root/core/utils/typi.js'

export class WorkerIgnitor extends Ignitor {
  private workers: Worker<object, JobHandlerResponse | undefined, string>[] = []
  private jobs: Map<string, new () => BaseJob<object>> = new Map()

  async start() {
    await this.startDatabaseConnector()

    this.registerJobs()

    return this
  }

  registerJobs() {
    this.registerJob(SendBroadcastJob.id, SendBroadcastJob)
    this.registerJob(ImportContactsJob.id, ImportContactsJob)
    this.registerJob(SendBroadcastToContact.id, SendBroadcastToContact)
    this.registerJob(SendTransactionalEmailJob.id, SendTransactionalEmailJob)
  }

  private registerJob(id: string, job: new () => BaseJob<object>) {
    this.jobs.set(id, job)

    return this
  }

  private async processJob(job: Job) {
    const Executor = this.jobs.get(job.name)

    if (!Executor) {
      d(['No handler defined for job name:', job.name])

      return
    }

    const executor = container.make(Executor)

    const logger = makeLogger()
    logger.info(`Processing job ${job.name} with ID ${job.id}`)

    try {
      const result = await executor.handle({
        payload: job.data,
        database: makeDatabase(),
        redis: makeRedis(),
        logger,
      })

      logger.info(`Job ${job.name} with ID ${job.id} completed.`)
      logger.info(`Result: ${JSON.stringify(result)}`)

      return result
    } catch (error) {
      logger.error(error)

      throw error
    }
  }

  listen(queueNames: string[]) {
    for (const [idx, queue] of queueNames.entries()) {
      this.workers[idx] = new Worker(queue, this.processJob.bind(this), {
        connection: this.redis,
      })
    }

    d(`Worker listening for jobs on queues: ${queueNames.join(', ')}`)
  }

  async shutdown() {
    await super.shutdown()

    for (const worker of this.workers) {
      await worker.close()
    }
  }
}
