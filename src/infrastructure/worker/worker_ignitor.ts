import { SendBroadcastJob } from "@/domains/broadcasts/jobs/send_broadcast_job.ts"
import { DatabaseQueueDriver } from "@/domains/shared/queue/drivers/database_queue_driver.ts"
import { Queue } from "@/domains/shared/queue/queue.ts"
import { SendTransactionalEmailJob } from "@/domains/transactional/jobs/send_transactional_email_job.ts"
import { Ignitor } from "@/infrastructure/boot/ignitor.ts"
import { container } from "@/utils/typi.ts"

export class WorkerIgnitor extends Ignitor {
  start() {
    this.startDatabaseConnector()

    this.queueDriver(container.make(DatabaseQueueDriver))
    this.registerJobs()

    return this
  }

  registerJobs() {
    Queue.registerJob(SendBroadcastJob.id, SendBroadcastJob)
    Queue.registerJob(SendTransactionalEmailJob.id, SendTransactionalEmailJob)
  }

  listen() {
    Queue.process()

    d(`Queue listening for jobs:`)
  }
}
