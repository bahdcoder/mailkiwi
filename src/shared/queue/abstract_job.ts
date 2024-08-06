import type { DrizzleClient } from "@/database/client.js";
import type { AVAILABLE_QUEUE_TYPE } from "./config.js";

export interface JobHandlerResponse {
  success: boolean;
  output?: string;
}

type PromiseFunction<T> = () => Promise<T>;
type ErrorHandler = (error: Error) => Promise<void>;
type PromiseItem<T> = [PromiseFunction<T>, ErrorHandler];

export abstract class BaseJob<T extends object = object> {
  static get id(): string {
    throw new Error("ID is not defined for this job.");
  }

  get batchSize(): number {
    return 75;
  }

  static get queue(): AVAILABLE_QUEUE_TYPE {
    throw new Error("Queue is not defined for this job.");
  }

  done(output?: string) {
    return { success: true, output };
  }

  fail(output?: string) {
    return { success: false, output };
  }

  processPromises<T>(
    items: PromiseItem<T>[],
    concurrency: number,
  ): Promise<(T | undefined)[]> {
    let index = 0;
    const results: (T | undefined)[] = new Array(items.length);

    const runNext = async (): Promise<void> => {
      if (index >= items.length) return;

      const currentIndex = index++;
      const [promiseFn, errorHandler] = items[currentIndex];

      try {
        const result = await promiseFn();
        results[currentIndex] = result;
      } catch (error) {
        await errorHandler(error as Error);
        results[currentIndex] = undefined;
      }

      await runNext();
    };

    return new Promise<(T | undefined)[]>((resolve) => {
      const runBatch = async () => {
        const batch = Array(Math.min(concurrency, items.length))
          .fill(null)
          .map(() => runNext());

        await Promise.all(batch);

        if (index < items.length) {
          await runBatch();
        } else {
          resolve(results);
        }
      };

      runBatch();
    });
  }

  abstract handle(ctx: JobContext<T>): Promise<JobHandlerResponse>;
}

export type AbstractJobType<T extends object = object> = {
  new: () => BaseJob<T>;
  id: string;
  queue: AVAILABLE_QUEUE_TYPE;
};

export interface JobContext<T> {
  database: DrizzleClient;
  payload: T;
}
