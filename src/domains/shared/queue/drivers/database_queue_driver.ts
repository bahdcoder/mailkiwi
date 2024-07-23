import { QueueDriver } from "@/domains/shared/queue/queue_driver_contact.js"
import { makeDatabase } from "@/infrastructure/container.js"
import { queueJobs } from "@/infrastructure/database/schema/schema.js"
import { cuid } from "@/domains/shared/utils/cuid/cuid.ts"
import { AVAILABLE_QUEUE_TYPE, AVAILABLE_QUEUES } from "../config.ts"
import { sleep } from "@/utils/sleep.ts"
import { and, asc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm"
import { addSecondsToDate } from "@/utils/dates.ts"
import { BaseJob, JobHandlerResponse } from "../abstract_job.ts"
import { QueueJob } from "@/infrastructure/database/schema/types.ts"

export class DatabaseQueueDriver implements QueueDriver {
  constructor(private database = makeDatabase()) {}

  private CONCURRENCY = 5
  private DEFAULT_TIMEOUT = 15 // 15 seconds
  private jobExecutors: Map<string, new () => BaseJob<object>>
  private currentQueueJobs: Map<AVAILABLE_QUEUE_TYPE, number> = new Map()

  async dispatch(
    jobId: string,
    payload: Record<string, unknown>,
    queue: AVAILABLE_QUEUE_TYPE,
  ) {
    const id = cuid()

    await this.database.insert(queueJobs).values({
      id,
      jobId,
      queue: queue,
      payload,
      dispatchedAt: new Date(),
    })

    return { id }
  }

  async process(jobs: Map<string, new () => BaseJob<object>>) {
    this.jobExecutors = jobs

    this.beginProcessing()
  }

  private async fetchAvailableJobs() {
    let jobsPerQueue = []
    const queues = Object.keys(AVAILABLE_QUEUES)

    for (const queue of queues) {
      jobsPerQueue.push(
        this.database.query.queueJobs.findMany({
          limit: this.CONCURRENCY,
          where: and(
            or(isNull(queueJobs.lockedAt), lt(queueJobs.timeoutAt, new Date())),
            isNull(queueJobs.completedAt),
            eq(queueJobs.queue, queue),
          ),
          orderBy: asc(queueJobs.dispatchedAt),
        }),
      )
    }

    const jobs = await Promise.all(jobsPerQueue)

    return jobs.map((jobs, idx) => ({ queue: queues[idx], jobs })).flat() as {
      queue: AVAILABLE_QUEUE_TYPE
      jobs: QueueJob[]
    }[]
  }

  private async lockJobs(jobIds: string[]) {
    if (jobIds.length === 0) {
      return false
    }

    return this.database.transaction((tx) => {
      const updates = tx
        .update(queueJobs)
        .set({
          timeoutAt: addSecondsToDate(new Date(), this.DEFAULT_TIMEOUT),
          lockedAt: new Date(),
        })
        .where(
          and(
            inArray(queueJobs.id, jobIds),
            or(isNull(queueJobs.lockedAt), lt(queueJobs.timeoutAt, new Date())),
          ),
        )
        .run()

      if (updates.changes === jobIds.length) {
        return true
      }

      tx.rollback()

      return false
    })
  }

  private async beginProcessing() {
    while (true) {
      const jobs = await this.fetchAvailableJobs()

      const jobIds = jobs.map(({ jobs }) => jobs.map((job) => job.id)).flat()

      // lock jobs by inserting into database (and setting job timeouts.).
      const locked = await this.lockJobs(jobIds)

      if (!locked) {
        await sleep(1000)

        continue
      }

      // process jobs
      // d({ jobs: jobs.map((job) => [job.id, job.lockedAt, job.timeoutAt]) })

      // for each job, dispatch it for processing to the right queue.
      // dispatch job to the right queue.
      for (const { queue, jobs: queueJobs } of jobs) {
        this.startProcessingQueue(queue, queueJobs)
      }

      await sleep(1000)
    }
  }

  private async startProcessingQueue(
    queue: AVAILABLE_QUEUE_TYPE,
    jobs: QueueJob[],
  ) {
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
