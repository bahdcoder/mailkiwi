import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js"

import { teamMemberships, teams, users } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

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
  private KEY_PREFIX = "API_KEY"

  constructor(private redis = makeRedis()) {}

  private pair = {
    username: "",
    apiKey: new Secret(""),
  }

  async destroy() {
    await this.redis.del(this.key())
  }

  username(username: string) {
    this.pair.username = username

    return this
  }

  get() {
    return this.redis.get(this.key())
  }

  private key() {
    return `${this.KEY_PREFIX}:${this.pair.username}`
  }

  apiKey(apiKey: Secret<string>) {
    this.pair.apiKey = apiKey

    return this
  }

  async save() {
    await this.redis.set(this.key(), this.pair.apiKey.release())
  }
}

export class CachedDomainDkim {
  private HASH_PREFIX = "DOMAIN"
  private domain: string

  constructor(private redis = makeRedis()) {}

  forDomain(domain: string) {
    this.domain = domain

    return this
  }

  private key() {
    return `${this.HASH_PREFIX}:${this.domain}`
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
