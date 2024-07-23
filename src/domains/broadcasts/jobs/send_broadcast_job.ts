import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'
import { sleep } from '@/utils/sleep.ts'

export interface SendBroadcastJobPayload {
  broadcastId: string
}

export class SendBroadcastJob extends BaseJob<SendBroadcastJobPayload> {
  static get id() {
    return 'BROADCASTS::SEND_BROADCAST'
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  async handle(ctx: JobContext<SendBroadcastJobPayload>) {
    const timeout = Math.floor(Math.random() * 10000)

    // count all contacts in the audience who will receive the email
    // say we have 100,000
    // create batches of 100 and dispatch the job SendBroadcastToContacts with the id of all 100 contacts
    // then mark this job as completed

    await sleep(timeout)

    return { success: true, output: 'Success' }
  }
}
