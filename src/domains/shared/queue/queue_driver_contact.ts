export interface QueueDriver {
  dispatch(jobName: string, payload: object): Promise<void>
  process(jobName: string, handler: (payload: object) => Promise<void>): void
}
