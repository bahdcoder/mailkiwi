import { E_OPERATION_FAILED } from "@/http/responses/errors.ts"
import { BaseJob } from "./abstract_job.js"
import { QueueDriver } from "./queue_driver_contact.js"

export class Queue {
  private static driver: QueueDriver

  static setDriver(driver: QueueDriver) {
    this.driver = driver

    return this
  }

  static async dispatch<T extends BaseJob<object>>(
    JobClass: new () => T,
    payload: T extends BaseJob<infer P> ? P : never,
  ) {
    if (!this.driver) {
      throw E_OPERATION_FAILED(
        "Queue driver not set for this application instance.",
      )
    }

    const job = new JobClass()

    return this.driver.dispatch(job.id, payload)
  }
}
