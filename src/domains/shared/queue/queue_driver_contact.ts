import type { BaseJob } from './abstract_job.ts'
import type { AVAILABLE_QUEUE_TYPE } from './config.ts'

export interface QueueJobConfiguration {
  delay?: number
}

export interface QueueDriver {
  dispatch(
    jobName: string,
    payload: object,
    queue: AVAILABLE_QUEUE_TYPE,
    configuration?: QueueJobConfiguration,
  ): Promise<{ id: string }>
  process(jobs: Map<string, new () => BaseJob<object>>): void
}
