import { makeRedis } from '#root/core/shared/container/index.js'

type CacheNamespace = 'domains' | 'teams' | 'access_tokens' | 'websites' | 'audiences'

export class Cache {
  constructor(protected redis = makeRedis()) {}

  private cacheNamespace: CacheNamespace

  namespace(namespace: CacheNamespace) {
    this.cacheNamespace = namespace

    return this
  }

  cacheKey(key: string) {
    return `${this.cacheNamespace}:${key}`
  }

  async get<T extends object>(key: string, $defaultFn: () => T): Promise<T> {
    const cacheKey = this.cacheKey(key)

    const cachedValue = await this.redis.get(cacheKey)

    if (!cachedValue) {
      const value = await $defaultFn()

      await this.redis.set(cacheKey, this.serialize(value))

      return value
    }

    return this.deserialize(cachedValue)
  }

  async clear(key: string) {
    await this.redis.del(this.cacheKey(key))
  }

  protected serialize<T extends object>(value: T): string {
    return JSON.stringify(value)
  }

  protected deserialize<T extends object>(value: string): T {
    return JSON.parse(value)
  }
}
