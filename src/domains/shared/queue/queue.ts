import { E_OPERATION_FAILED } from "@/http/responses/errors.ts"
import { AbstractJobType, BaseJob } from "./abstract_job.js"
import { QueueDriver } from "./queue_driver_contact.js"

export class Queue {
  private static driver: QueueDriver
  public static jobs: Map<string, new () => BaseJob> = new Map()

  static registerJob(id: string, job: new () => BaseJob<object>) {
    this.jobs.set(id, job)

    return this
  }

  static setDriver(driver: QueueDriver) {
    this.driver = driver

    return this
  }

  static async dispatch<T extends object>(
    JobClass: new () => BaseJob<T>,
    payload: T,
  ) {
    if (!this.driver) {
      throw E_OPERATION_FAILED(
        "Queue driver not set for this application instance.",
      )
    }

    return this.driver.dispatch(
      (JobClass as unknown as AbstractJobType<T>).id,
      payload,
      (JobClass as unknown as AbstractJobType<T>).queue,
    )
  }

  static async process() {
    this.driver.process(this.jobs)
  }
}
