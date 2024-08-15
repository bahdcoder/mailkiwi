import { SendBroadcastJob } from '@/broadcasts/jobs/send_broadcast_job.js'
import { SendBroadcastToContact } from '@/broadcasts/jobs/send_broadcast_to_contact_job.js'
import { MailhogDriver } from '@/shared/mailers/drivers/mailhog_mailer_driver.js'
import type { BaseJob } from '@/shared/queue/abstract_job.js'
import { SendTransactionalEmailJob } from '@/transactional/jobs/send_transactional_email_job.js'
import { Ignitor } from '@/boot/ignitor.js'
import { type Job, Worker } from 'bullmq'
import { makeDatabase, makeRedis } from '@/shared/container/index.js'

export class WorkerIgnitor extends Ignitor {
  private workers: Worker<any, any, string>[] = []
  private jobs: Map<string, new () => BaseJob<object>> = new Map()

  async start() {
    await this.startDatabaseConnector()

    this.mailerDriver(({ SMTP_TEST_URL }) => new MailhogDriver(SMTP_TEST_URL))
    this.registerJobs()

    return this
  }

  registerJobs() {
    this.registerJob(SendBroadcastJob.id, SendBroadcastJob)
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

    await new Executor().handle({
      payload: job.data,
      redis: makeRedis(),
      database: makeDatabase(),
    })
  }

  listen(queueNames: string[]) {
    for (const [idx, queue] of queueNames.entries()) {
      this.workers[idx] = new Worker(
        queue,
        async (job) => this.processJob(job),
        {
          connection: { host: 'localhost', port: 6379 },
        },
      )
    }

    d(`Queue listening for jobs on queues: ${queueNames.join(', ')}`)
  }

  async shutdown() {
    await super.shutdown()

    for (const worker of this.workers) {
      await worker.close()
    }
  }
}
