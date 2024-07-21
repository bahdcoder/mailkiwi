import { DrizzleClient } from "@/infrastructure/database/client.js"

export abstract class BaseJob<T extends object = object> {
  abstract id: string
  abstract handle(ctx: JobContext<T>): Promise<void>
}

export interface JobContext<T> {
  database: DrizzleClient
  payload: T
}
