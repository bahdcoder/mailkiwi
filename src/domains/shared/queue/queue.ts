import { E_OPERATION_FAILED } from '@/http/responses/errors.ts'
import type { AbstractJobType, BaseJob } from './abstract_job.js'
import type {
  QueueDriver,
  QueueJobConfiguration,
} from './queue_driver_contact.js'

class QueueClass {
  private driver: QueueDriver
  public jobs: Map<string, new () => BaseJob> = new Map()

  registerJob(id: string, job: new () => BaseJob<object>) {
    this.jobs.set(id, job)

    return this
  }

  setDriver(driver: QueueDriver) {
    this.driver = driver

    return this
  }

  async dispatch<T extends object>(
    JobClass: new () => BaseJob<T>,
    payload: T,
    configuration?: QueueJobConfiguration,
  ) {
    if (!this.driver) {
      throw E_OPERATION_FAILED(
        'Queue driver not set for this application instance.',
      )
    }

    return this.driver.dispatch(
      (JobClass as unknown as AbstractJobType<T>).id,
      payload,
      (JobClass as unknown as AbstractJobType<T>).queue,
      configuration,
    )
  }

  async process() {
    this.driver.process(this.jobs)
  }
}

export const Queue = new QueueClass()
