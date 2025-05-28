import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { sleep } from '#root/core/utils/sleep.js'

export interface SendTransactionalEmailJobPayload {
  broadcastId: string
}

export class SendTransactionalEmailJob extends BaseJob<SendTransactionalEmailJobPayload> {
  static get id() {
    return 'TRANSACTIONAL::SEND_EMAIL'
  }

  static get queue() {
    return AVAILABLE_QUEUES.transactional
  }

  async handle(ctx: JobContext<SendTransactionalEmailJobPayload>) {
    const timeout = Math.floor(Math.random() * 10000)

    await sleep(timeout)

    return { success: true, output: 'Success' }
  }

  async failed() {}
}
