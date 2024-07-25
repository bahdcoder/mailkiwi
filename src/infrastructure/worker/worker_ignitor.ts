import { SendBroadcastJob } from '@/domains/broadcasts/jobs/send_broadcast_job.ts'
import { SendBroadcastToContacts } from '@/domains/broadcasts/jobs/send_broadcast_to_contacts_job.ts'
import { MailhogDriver } from '@/domains/shared/mailers/drivers/mailhog_mailer_driver.ts'
import { DatabaseQueueDriver } from '@/domains/shared/queue/drivers/database_queue_driver.ts'
import { Queue } from '@/domains/shared/queue/queue.ts'
import { VerifyMailerIdentityJob } from '@/domains/teams/jobs/verify_mailer_identity_job.ts'
import { SendTransactionalEmailJob } from '@/domains/transactional/jobs/send_transactional_email_job.ts'
import { Ignitor } from '@/infrastructure/boot/ignitor.ts'
import { container } from '@/utils/typi.ts'

export class WorkerIgnitor extends Ignitor {
  start() {
    this.startDatabaseConnector()

    this.queueDriver(container.make(DatabaseQueueDriver))
    this.mailerDriver(({ MAILHOG_URL }) => new MailhogDriver(MAILHOG_URL))
    this.registerJobs()

    return this
  }

  registerJobs() {
    Queue.registerJob(SendBroadcastJob.id, SendBroadcastJob)
    Queue.registerJob(VerifyMailerIdentityJob.id, VerifyMailerIdentityJob)
    Queue.registerJob(SendBroadcastToContacts.id, SendBroadcastToContacts)
    Queue.registerJob(SendTransactionalEmailJob.id, SendTransactionalEmailJob)
  }

  listen() {
    Queue.process()

    d('Queue listening for jobs:')
  }
}
