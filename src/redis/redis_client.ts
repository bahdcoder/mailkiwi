import { Secret } from "@poppinss/utils"
import { Redis } from "ioredis"

export const REDIS_KNOWN_KEYS = {
  API_KEY(username: string) {
    return `API_KEY:${username}`
  },
  DOMAIN(domain: string) {
    return `DOMAIN:${domain}`
  },
  ACCESS_KEY(username: string) {
    return `ACCESS_KEY:${username}`
  },
  TEAM_USAGE_TRACKING(teamId: number) {
    return `TEAM_USAGE_TRACKING:${teamId.toString()}`
  },
}

export const createRedisDatabaseInstance = (url: Secret<string>) => {
  return new Redis(url.release(), { maxRetriesPerRequest: null })
}
