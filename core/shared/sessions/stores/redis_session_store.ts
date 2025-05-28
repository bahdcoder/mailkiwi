import { DateTime } from 'luxon'

import { makeRedis } from '#root/core/shared/container/index.js'

import { REDIS_KNOWN_KEYS } from '#root/core/redis/redis_client.js'

export interface RedisSessionData {
  userId: string
  ip?: string
  userAgent?: string
  expiresAt: string
  createdAt: string
  deviceInfo?: string
  location?: string
  currentTeamId?: string
}

export class RedisSessionStore {
  private readonly SESSION_EXPIRY = 30 * 24 * 60 * 60 // 30 days in seconds

  constructor(protected redis = makeRedis()) {}

  async create(userId: string, sessionId: string, data?: Partial<RedisSessionData>) {
    const now = DateTime.now().toJSDate().toISOString()
    const expiresAt = DateTime.now()
      .plus({ seconds: this.SESSION_EXPIRY })
      .toJSDate()
      .toISOString()

    const sessionData: RedisSessionData = {
      userId,
      createdAt: now,
      expiresAt,
      ...data,
    }

    await this.redis
      .multi()
      .hset(REDIS_KNOWN_KEYS.SESSION(sessionId), sessionData)
      .sadd(REDIS_KNOWN_KEYS.USER_SESSIONS(userId), sessionId)
      .expire(REDIS_KNOWN_KEYS.SESSION(sessionId), this.SESSION_EXPIRY)
      .exec()

    return { sessionId }
  }

  async update(
    sessionId: string,
    key: keyof Omit<RedisSessionData, 'userId'>,
    value: string,
  ) {
    await this.redis.multi().hset(REDIS_KNOWN_KEYS.SESSION(sessionId), key, value).exec()
  }

  async get(sessionId: string) {
    const session = await this.redis.hgetall(REDIS_KNOWN_KEYS.SESSION(sessionId))

    if (!session || Object.keys(session).length === 0) return null

    return session as unknown as RedisSessionData
  }

  async remove(sessionId: string) {
    const session = await this.get(sessionId)

    if (!session) return

    await this.redis
      .multi()
      .del(REDIS_KNOWN_KEYS.SESSION(sessionId))
      .srem(REDIS_KNOWN_KEYS.USER_SESSIONS(session.userId), sessionId)
      .exec()
  }

  async clear(userId: string) {
    const sessionIds = await this.redis.smembers(REDIS_KNOWN_KEYS.USER_SESSIONS(userId))

    if (sessionIds.length === 0) return

    const multi = this.redis.multi()

    for (const sessionId of sessionIds) {
      multi.del(REDIS_KNOWN_KEYS.SESSION(sessionId))
    }

    multi.del(REDIS_KNOWN_KEYS.USER_SESSIONS(userId))

    await multi.exec()
  }

  async list(userId: string) {
    const sessionIds = await this.redis.smembers(REDIS_KNOWN_KEYS.USER_SESSIONS(userId))

    const sessions = await Promise.all(sessionIds.map((sessionId) => this.get(sessionId)))

    return sessions.filter((session) => session !== null) as RedisSessionData[]
  }
}
