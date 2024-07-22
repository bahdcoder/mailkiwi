import { QueueDriver } from "../queue_driver_contact.js"

export class DatabaseQueueDriver implements QueueDriver {
  async dispatch(jobName: string, payload: object) {
    d("Dispatched new job:", { jobName, payload })
  }

  async process(jobName: string, handler: (payload: object) => Promise<void>) {}
}
