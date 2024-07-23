import type { BaseJob } from './abstract_job.ts'
import type { AVAILABLE_QUEUE_TYPE } from './config.ts'

export interface QueueDriver {
  dispatch(
    jobName: string,
    payload: object,
    queue: AVAILABLE_QUEUE_TYPE,
  ): Promise<{ id: string }>
  process(jobs: Map<string, new () => BaseJob<object>>): void
}
