import type { Secret } from '@poppinss/utils'
import { Redis } from 'ioredis'

export const REDIS_KNOWN_KEYS = {
  SESSION(sessionId: string) {
    return `SESSION:${sessionId}`
  },
  USER_SESSIONS(userId: string) {
    return `USER:${userId}:SESSIONS`
  },
  CONTACT_SESSION(sessionId: string) {
    return `CONTACT_SESSION:${sessionId}`
  },
}

export const createRedisDatabaseInstance = (url: Secret<string>) => {
  return new Redis(url.release(), { maxRetriesPerRequest: null })
}
