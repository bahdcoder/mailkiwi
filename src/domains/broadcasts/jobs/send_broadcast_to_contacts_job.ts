import { BaseJob, JobContext } from "@/domains/shared/queue/abstract_job.ts"
import { AVAILABLE_QUEUES } from "@/domains/shared/queue/config.ts"
import { sleep } from "@/utils/sleep.ts"

export interface SendBroadcastToContactsPayload {
  broadcastId: string
  contactsIds: string[]
}

export class SendBroadcastToContacts extends BaseJob<SendBroadcastToContactsPayload> {
  static get id() {
    return "BROADCASTS::SEND_BROADCAST_TO_CONTACTS"
  }

  static get queue() {
    return AVAILABLE_QUEUES.broadcasts
  }

  async handle(ctx: JobContext<SendBroadcastToContactsPayload>) {
    const timeout = Math.floor(Math.random() * 10000)

    // receive a list of all contacts
    // concurrently run 5 sends each
    // for each contact, call aws api to send the email
    // once sent, store logs into database and mark this job as completed

    await sleep(timeout)

    return { success: true, output: "Success" }
  }
}
