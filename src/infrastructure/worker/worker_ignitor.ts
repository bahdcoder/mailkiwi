import { SendBroadcastJob } from '@/domains/broadcasts/jobs/send_broadcast_job.ts'
import { SendBroadcastToContact } from '@/domains/broadcasts/jobs/send_broadcast_to_contact_job.ts'
import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'
import type { BaseJob } from '@/domains/shared/queue/abstract_job.ts'
import { VerifyMailerIdentityJob } from '@/domains/teams/jobs/verify_mailer_identity_job.ts'
import { SendTransactionalEmailJob } from '@/domains/transactional/jobs/send_transactional_email_job.ts'
import { Ignitor } from '@/infrastructure/boot/ignitor.ts'
import { type Job, Worker } from 'bullmq'
import { makeDatabase } from '@/infrastructure/container.ts'

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
    this.registerJob(VerifyMailerIdentityJob.id, VerifyMailerIdentityJob)
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

    await new Executor().handle({ payload: job.data, database: makeDatabase() })
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
