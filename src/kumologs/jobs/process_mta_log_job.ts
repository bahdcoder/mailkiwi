import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

export interface ProcessMtaLogJobPayload {
  log: Record<string, string>
}

export class ProcessMtaLogJob extends BaseJob<ProcessMtaLogJobPayload> {
  static get id() {
    return "MTA_LOGS::PROCESS_MTA_LOG"
  }

  static get queue() {
    return AVAILABLE_QUEUES.mta_logs
  }

  async handle(ctx: JobContext<ProcessMtaLogJobPayload>) {
    return this.done()
  }

  async failed() {}
}
