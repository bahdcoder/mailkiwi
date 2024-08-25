import { Redis } from "ioredis"

export const createRedisDatabaseInstance = (url: string) => {
  return new Redis(url, { maxRetriesPerRequest: null })
}
