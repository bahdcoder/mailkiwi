import { DrizzleClient } from "@/infrastructure/database/client.js"
import { AVAILABLE_QUEUE_TYPE } from "./config.ts"

export interface JobHandlerResponse {
  success: boolean
  output?: string
}

export abstract class BaseJob<T extends object = object> {
  static get id(): string {
    throw new Error("ID is not defined for this job.")
  }

  static get queue(): AVAILABLE_QUEUE_TYPE {
    throw new Error("Queue is not defined for this job.")
  }

  abstract handle(ctx: JobContext<T>): Promise<JobHandlerResponse>
}

export type AbstractJobType<T extends object = object> = {
  new: () => BaseJob<T>
  id: string
  queue: AVAILABLE_QUEUE_TYPE
}

export interface JobContext<T> {
  database: DrizzleClient
  payload: T
}
