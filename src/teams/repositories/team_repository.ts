import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js"

import { teamMemberships, teams, users } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

import { REDIS_KNOWN_KEYS } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.ts"

export class TeamRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  private hasManyMemberships = hasMany(this.database, {
    from: teams,
    to: teamMemberships,
    primaryKey: teams.id,
    foreignKey: teamMemberships.teamId,
    relationName: "members",
  })

  async create(payload: CreateTeamDto, userId: number) {
    const insertResult = await this.database.insert(teams).values({
      ...payload,
      userId,
    })

    return { id: this.primaryKey(insertResult) }
  }

  async findUserDefaultTeam(userId: number) {
    const team = await this.hasManyMemberships((query) =>
      query
        .leftJoin(users, eq(users.id, teamMemberships.userId))
        .where(eq(teams.userId, userId))
        .limit(1),
    )

    return team[0]
  }

  async findById(teamId: number) {
    const team = await this.hasManyMemberships(
      (query) =>
        query
          .leftJoin(users, eq(users.id, teamMemberships.userId))
          .where(eq(teams.id, teamId)),
      (row) => ({
        ...row["teamMemberships"],
        user: row?.["users"],
      }),
    )

    return team[0]
  }

  dkim() {
    return container.make(CachedDomainDkim)
  }

  apiKeys() {
    return container.make(CachedTeamApiKeys)
  }
}

export interface CachedDkimHash {
  encryptedDkimPrivateKey: string
  returnPathSubDomain: string
  returnPathDomainCnameValue: string
  dkimSubDomain: string
  dkimPublicKey: string
}

export class CachedTeamApiKeys {
  constructor(private redis = makeRedis()) {}

  private pair = {
    accessKey: "",
    accessSecret: "",
  }

  async destroy() {
    await this.redis.del(this.key())
  }

  get() {
    return this.redis.get(this.key())
  }

  private key() {
    return REDIS_KNOWN_KEYS.ACCESS_KEY(this.pair.accessKey)
  }

  accessKey(accessKey: string) {
    this.pair.accessKey = accessKey

    return this
  }

  accessSecret(accessSecret: string) {
    this.pair.accessSecret = accessSecret

    return this
  }

  async save() {
    await this.redis.set(this.key(), this.pair.accessSecret)
  }
}

export class CachedDomainDkim {
  private domain: string

  constructor(private redis = makeRedis()) {}

  forDomain(domain: string) {
    this.domain = domain

    return this
  }

  private key() {
    return REDIS_KNOWN_KEYS.DOMAIN(this.domain)
  }

  async get() {
    return this.redis.hgetall(
      this.key(),
    ) as unknown as Promise<CachedDkimHash>
  }

  async save(payload: Partial<CachedDkimHash>) {
    await this.redis.hmset(this.key(), {
      encryptedDkimPrivateKey: payload.encryptedDkimPrivateKey,
      returnPathSubDomain: payload.returnPathSubDomain,
      dkimSubDomain: payload.dkimSubDomain,
      returnPathDomainCnameValue: payload.returnPathDomainCnameValue,
      dkimPublicKey: payload.dkimPublicKey,
    })
  }
}
