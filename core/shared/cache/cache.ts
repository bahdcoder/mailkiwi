import { FrameworkCache } from '@kibamail/framework'

type CacheNamespace = 'domains' | 'teams' | 'access_tokens' | 'websites' | 'audiences'

import { makeRedis } from '#root/core/shared/container/index.js'

declare module '@kibamail/framework' {
  interface ClientCacheNamespaces {
    domains: CacheNamespace
    teams: CacheNamespace
    access_tokens: CacheNamespace
    websites: CacheNamespace
    audiences: CacheNamespace
  }
}

export class Cache extends FrameworkCache {
  constructor() {
    super(makeRedis())
  }
}
