import nunjucks from 'nunjucks'

import { makeRedis } from '@/shared/container/index.ts'
export const KNOWN_KEYS = {
  TEAM_API_KEY: 'TEAM:{{entityId}}:API_KEY',
  TEAM_START_OF_MONTH_DATE: 'TEAM:{{entityId}}:START_OF_MONTH_DATE', // never changes, but is used to reset monthly free credits
  TEAM_FREE_CREDITS: 'TEAM:{{entityId}}:FREE_CREDITS', // stores amount of free credits for a team
  TEAM_AVAILABLE_CREDITS: 'TEAM:{{entityId}}:AVAILABLE_CREDITS', // stores purchased credits for a team
} as const

export type SupportedSetKeys = keyof typeof KNOWN_KEYS

export class RedisKeySetter {
  private entityId: string

  constructor(private redis = makeRedis()) {}

  entity(entityId: string) {
    this.entityId = entityId

    return this
  }

  private getKeyFromTemplate(keyId: SupportedSetKeys) {
    const keyTemplate = KNOWN_KEYS[keyId]

    return nunjucks.renderString(keyTemplate, { entityId: this.entityId })
  }

  async set(supportedKeyId: SupportedSetKeys, value: string) {
    return this.redis.set(this.getKeyFromTemplate(supportedKeyId), value)
  }

  async get(supportedKeyId: SupportedSetKeys) {
    return this.redis.get(this.getKeyFromTemplate(supportedKeyId))
  }
}
