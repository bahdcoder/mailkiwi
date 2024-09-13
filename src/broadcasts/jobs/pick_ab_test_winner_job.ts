import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

export interface PickAbTestWinnerJobPayload {
  broadcastId: string
}

export class PickAbTestWinnerJob extends BaseJob<PickAbTestWinnerJobPayload> {
  static get id() {
    return "ABTESTS_BROADCASTS::PICK_AB_TEST_WINNER"
  }

  static get queue() {
    return AVAILABLE_QUEUES.abtests_broadcasts
  }

  async handle({
    database,
    payload,
  }: JobContext<PickAbTestWinnerJobPayload>) {
    return this.done()
  }

  async failed() {}
}
