import { describe, test, vi } from "vitest"
import { createBroadcastForUser, createUser } from "../mocks/auth/users.ts"
import { makeRequestAsUser } from "../utils/http.ts"
import { makeDatabase } from "@/infrastructure/container.ts"
import { WorkerIgnitor } from "@/infrastructure/worker/worker_ignitor.ts"
import { refreshDatabase } from "../mocks/teams/teams.ts"
import { gt, isNull, not } from "drizzle-orm"
import { queueJobs } from "@/infrastructure/database/schema/schema.ts"
import { sleep } from "@/utils/sleep.ts"
import { Queue } from "@/domains/shared/queue/queue.ts"
import { BaseJob, JobContext } from "@/domains/shared/queue/abstract_job.ts"
import { AVAILABLE_QUEUES } from "@/domains/shared/queue/config.ts"

describe("Database queue worker", () => {
  test("can dispatch jobs to queue", async ({ expect }) => {
    const { user, audience, broadcastId } = await createUser({
      createBroadcast: true,
    })

    const database = makeDatabase()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(200)
    const queuedJob = await database.query.queueJobs.findFirst({})

    expect(queuedJob?.jobId).toBe("BROADCASTS::SEND_BROADCAST")
  })

  test("can complete jobs added to queue", async ({ expect }) => {
    await refreshDatabase()

    let processedJobIds: number[] = []

    class FakeJob extends BaseJob<{ id: number }> {
      static get id() {
        return "BROADCASTS::FAKE_JOB"
      }

      static get queue() {
        return AVAILABLE_QUEUES.broadcasts
      }

      async handle(ctx: JobContext<{ id: number }>) {
        processedJobIds.push(ctx.payload.id)

        return { success: true }
      }
    }

    Queue.registerJob(FakeJob.id, FakeJob)

    for (let id = 0; id < 5; id++) {
      await Queue.dispatch(FakeJob, { id })
    }

    const database = makeDatabase()

    const allQueuedJobs = await database.query.queueJobs.findMany({})

    expect(allQueuedJobs).toHaveLength(5)

    new WorkerIgnitor().boot().start().listen()

    await sleep(100)

    expect(processedJobIds).toEqual([0, 1, 2, 3, 4])

    const allQueuedJobsCompleted = await database.query.queueJobs.findMany({
      where: not(isNull(queueJobs.completedAt)),
    })

    expect(allQueuedJobsCompleted).toHaveLength(5)
  })

  test("marks failed jobs as failed from the queue", async ({ expect }) => {
    await refreshDatabase()

    let processedJobIds: number[] = []

    class FakeJob extends BaseJob<{ id: number }> {
      static get id() {
        return "BROADCASTS::FAKE_JOB"
      }

      static get queue() {
        return AVAILABLE_QUEUES.broadcasts
      }

      async handle(ctx: JobContext<{ id: number }>) {
        processedJobIds.push(ctx.payload.id)

        return { success: false }
      }
    }

    Queue.registerJob(FakeJob.id, FakeJob)

    for (let id = 0; id < 5; id++) {
      await Queue.dispatch(FakeJob, { id })
    }

    const database = makeDatabase()

    const allQueuedJobs = await database.query.queueJobs.findMany({})

    expect(allQueuedJobs).toHaveLength(5)

    new WorkerIgnitor().boot().start().listen()

    await sleep(100)

    expect(processedJobIds).toEqual([0, 1, 2, 3, 4])

    const allQueuedJobsCompleted = await database.query.queueJobs.findMany({
      where: not(isNull(queueJobs.completedAt)),
    })

    const allAttemptedJobs = await database.query.queueJobs.findMany({
      where: gt(queueJobs.attemptsCount, 0),
    })

    expect(allQueuedJobsCompleted).toHaveLength(0)
    expect(allAttemptedJobs).toHaveLength(5)
  })

  test("gracefuly marks job as failed if it throws an error", async ({
    expect,
  }) => {
    await refreshDatabase()

    class FakeJob extends BaseJob<{ id: number }> {
      static get id() {
        return "BROADCASTS::FAKE_JOB"
      }

      static get queue() {
        return AVAILABLE_QUEUES.broadcasts
      }

      async handle(ctx: JobContext<{ id: number }>): Promise<any> {
        throw new Error("Job failed for some reason.")
      }
    }

    Queue.registerJob(FakeJob.id, FakeJob)

    for (let id = 0; id < 5; id++) {
      await Queue.dispatch(FakeJob, { id })
    }

    const database = makeDatabase()

    new WorkerIgnitor().boot().start().listen()

    await sleep(100)

    const allAttemptedJobs = await database.query.queueJobs.findMany({
      where: gt(queueJobs.attemptsCount, 0),
    })

    expect(allAttemptedJobs).toHaveLength(5)
  })
})
