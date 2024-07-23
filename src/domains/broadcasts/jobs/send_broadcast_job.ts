import { BaseJob, JobContext } from "@/domains/shared/queue/abstract_job.ts"
import { AVAILABLE_QUEUES } from "@/domains/shared/queue/config.ts"
import { sleep } from "@/utils/sleep.ts"

export interface SendBroadcastJobPayload {
  broadcastId: string
}

export class SendBroadcastJob extends BaseJob<SendBroadcastJobPayload> {
  static get id() {
    return "BROADCASTS::SEND_BROADCAST"
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  async handle(ctx: JobContext<SendBroadcastJobPayload>) {
    const timeout = Math.floor(Math.random() * 10000)

    await sleep(timeout)

    return { success: true, output: "Success" }
  }
}
