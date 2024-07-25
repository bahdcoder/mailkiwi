import type {
  QueueDriver,
  QueueJobConfiguration,
} from '@/domains/shared/queue/queue_driver_contact.js'
import { cuid } from '@/domains/shared/utils/cuid/cuid.ts'
import {
  makeDatabase,
  makeDatabaseConnection,
} from '@/infrastructure/container.js'
import { queueJobs } from '@/infrastructure/database/schema/schema.js'
import type { QueueJob } from '@/infrastructure/database/schema/types.ts'
import { addSecondsToDate } from '@/utils/dates.ts'
import { sleep } from '@/utils/sleep.ts'
import { and, asc, eq, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm'
import type { BaseJob, JobHandlerResponse } from '../abstract_job.ts'
import { AVAILABLE_QUEUES, type AVAILABLE_QUEUE_TYPE } from '../config.ts'

export class DatabaseQueueDriver implements QueueDriver {
  constructor(private database = makeDatabase()) {}

  private CONCURRENCY = 5
  private DEFAULT_TIMEOUT = 15 // 15 seconds
  private QUEUE_CHECKS = 1 // 1 second
  private intervalId: NodeJS.Timeout
  private jobExecutors: Map<string, new () => BaseJob<object>>
  private currentQueueJobs: Map<AVAILABLE_QUEUE_TYPE, number> = new Map()

  async dispatch(
    jobId: string,
    payload: Record<string, unknown>,
    queue: AVAILABLE_QUEUE_TYPE,
    configuration: QueueJobConfiguration,
  ) {
    const id = cuid()

    await this.database.insert(queueJobs).values({
      id,
      jobId,
      queue: queue,
      payload,
      dispatchedAt: new Date(),
      processAt: addSecondsToDate(new Date(), configuration?.delay ?? 0),
    })

    return { id }
  }

  async process(jobs: Map<string, new () => BaseJob<object>>) {
    this.jobExecutors = jobs

    this.runProcessorAsync()
  }

  private async fetchAvailableJobs() {
    const jobsPerQueue = []
    const queues = Object.keys(AVAILABLE_QUEUES)

    for (const queue of queues) {
      jobsPerQueue.push(
        this.database.query.queueJobs.findMany({
          limit: this.CONCURRENCY,
          where: and(
            or(isNull(queueJobs.lockedAt), lt(queueJobs.timeoutAt, new Date())),
            isNull(queueJobs.completedAt),
            eq(queueJobs.queue, queue),
            lt(queueJobs.processAt, new Date()),
          ),
          orderBy: asc(queueJobs.dispatchedAt),
        }),
      )
    }

    const jobs = await Promise.all(jobsPerQueue)

    return jobs.flatMap((jobs, idx) => ({ queue: queues[idx], jobs })) as {
      queue: AVAILABLE_QUEUE_TYPE
      jobs: QueueJob[]
    }[]
  }

  private async lockJobs(jobIds: string[]) {
    if (jobIds.length === 0) {
      return false
    }

    const updateIfNotLocked = this.database
      .update(queueJobs)
      .set({
        timeoutAt: addSecondsToDate(new Date(), this.DEFAULT_TIMEOUT),
        lockedAt: new Date(),
      })
      .where(
        and(
          inArray(queueJobs.id, jobIds),
          or(isNull(queueJobs.lockedAt), lt(queueJobs.timeoutAt, new Date())),
          lt(queueJobs.processAt, new Date()),
          lte(queueJobs.attemptsCount, queueJobs.maxAttempts),
        ),
      )
      .toSQL()

    const db = makeDatabaseConnection()

    const updateIfNotLockedPrepared = db.prepare(updateIfNotLocked.sql)

    const updateIfNotLockedTransaction = db.transaction((input) => {
      const result = updateIfNotLockedPrepared.run(updateIfNotLocked.params)

      if (result.changes !== jobIds.length) {
        throw new Error('Jobs already locked.')
      }

      return true
    })

    try {
      const result = updateIfNotLockedTransaction(updateIfNotLocked.params)

      return result
    } catch (error) {
      d('Job locked by another worker.')
      return false
    }
  }

  private async runProcessor() {
    const jobs = await this.fetchAvailableJobs()

    const jobIds = jobs.flatMap(({ jobs }) => jobs.map((job) => job.id))

    const locked = await this.lockJobs(jobIds)

    if (!locked) {
      return
    }

    for (const { queue, jobs: queueJobs } of jobs) {
      this.startProcessingQueue(queue, queueJobs)
    }
  }

  private runProcessorAsync() {
    this.intervalId = setInterval(() => {
      this.runProcessor()
    }, this.QUEUE_CHECKS * 1000)
  }

  public shutdownProcessor() {
    clearInterval(this.intervalId)

    d('Queue processor stopped.')
    process.exit(0)
  }

  private async startProcessingQueue(
    queue: AVAILABLE_QUEUE_TYPE,
    jobs: QueueJob[],
  ) {
    // batch queue jobs based on the concurrency defined in a config.
    // at the moment its just processing everything.
    // also possible to execute only one queue at a time.
    await Promise.all(jobs.map((job) => this.processJob(job)))
  }

  private async processJob(job: QueueJob) {
    const Executor = this.jobExecutors.get(job.jobId)

    if (!Executor) {
      await this.giveUpOnJobExecution(job)

      return
    }

    const executor = new Executor()

    try {
      d(`Processing job: ${job.id} on queue: ${job.queue}`)

      const response = await executor.handle({
        database: this.database,
        payload: job.payload,
      })

      if (response.success) {
        await this.markJobAsCompleted(job, response)
      } else {
        await this.markJobAsFailed(job, response)
      }
    } catch (error) {
      await this.markJobAsFailed(job, {
        success: false,
        output: JSON.parse(JSON.stringify(error)),
      })
    }
  }

  private async markJobAsFailed(job: QueueJob, response: JobHandlerResponse) {
    const freshJob = await this.freshJob(job)

    await this.database
      .update(queueJobs)
      .set({
        lockedAt: null,
        timeoutAt: null,
        attemptsCount: sql`${queueJobs.attemptsCount} + 1`,
        attemptLogs: response.output
          ? [...(freshJob?.attemptLogs ?? []), response.output]
          : freshJob?.attemptLogs,
      })
      .where(eq(queueJobs.id, job.id))
  }

  private async freshJob(job: QueueJob) {
    return this.database.query.queueJobs.findFirst({
      where: eq(queueJobs.id, job.id),
    })
  }

  private async markJobAsCompleted(
    job: QueueJob,
    response: JobHandlerResponse,
  ) {
    const freshJob = await this.freshJob(job)

    d(`Marking job as completed: ${job.id} on queue: ${job.queue}`)

    await this.database
      .update(queueJobs)
      .set({
        completedAt: new Date(),
        lockedAt: null,
        timeoutAt: null,
        attemptLogs: response.output
          ? [...(freshJob?.attemptLogs ?? []), response.output]
          : freshJob?.attemptLogs,
      })
      .where(eq(queueJobs.id, job.id))
  }

  private async giveUpOnJobExecution(job: QueueJob) {
    await this.database
      .update(queueJobs)
      .set({
        lockedAt: null,
        timeoutAt: null,
      })
      .where(eq(queueJobs.id, job.id))
  }
}

// EmailQueue.dispatch(SendBroadcastJob, { broadcastId: broadcast.id })
// EmailWorker.process()
// Queue.process()
