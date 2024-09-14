import type { AVAILABLE_QUEUE_TYPE } from "./config.js"
import type { Redis } from "ioredis"

import type { DrizzleClient } from "@/database/client.js"

export interface JobHandlerResponse {
  success: boolean
  output?: string
}

type PromiseFunction<T> = () => Promise<T>
type ErrorHandler = (error: Error) => Promise<void>
type PromiseItem<T> = [PromiseFunction<T>, ErrorHandler]

export abstract class BaseJob<T extends object = object> {
  static get id(): string {
    throw new Error("ID is not defined for this job.")
  }

  get batchSize(): number {
    return 75
  }

  static get queue(): AVAILABLE_QUEUE_TYPE {
    throw new Error("Queue is not defined for this job.")
  }

  done(output?: string) {
    return { success: true, output }
  }

  fail(output?: string) {
    return { success: false, output }
  }

  abstract handle(ctx: JobContext<T>): Promise<JobHandlerResponse>
  abstract failed(ctx: JobContext<T>): Promise<void>
}

export type AbstractJobType<T extends object = object> = {
  new: () => BaseJob<T>
  id: string
  queue: AVAILABLE_QUEUE_TYPE
}

export interface JobContext<T> {
  database: DrizzleClient
  redis: Redis
  payload: T
}
