import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'
import { sleep } from '@/utils/sleep.ts'

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
}
