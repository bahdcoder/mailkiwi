import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js"

import { teamMemberships, teams, users } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { TeamWithMembers } from "@/shared/types/team.ts"

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

  usage(teamId: number) {
    return container.make(TeamUsage).forTeam(teamId)
  }
}

export interface TeamUsagePayload {
  availableCredits: number
  startOfMonth: string
  freeCredits: number
  apiKey: string
  domain: string
  encryptedDkimPrivateKey: string
  returnPathSubDomain: string
  returnPathDomainCnameValue: string
  dkimSubDomain: string
  dkimPublicKey: string
}

export class TeamUsage {
  private HASH_PREFIX = "TEAM"
  private teamId: number

  constructor(private redis = makeRedis()) {}

  forTeam(teamId: number) {
    this.teamId = teamId

    return this
  }

  private key() {
    return `${this.HASH_PREFIX}:${this.teamId}`
  }

  private domainKey(domain: string) {
    return `${this.HASH_PREFIX}:domain:${domain}`
  }

  async get() {
    return this.redis.hgetall(
      this.key(),
    ) as unknown as Promise<TeamUsagePayload>
  }

  async set(payload: Partial<TeamUsagePayload>) {
    await Promise.all([
      this.redis.hmset(
        this.key(),
        Object.fromEntries(
          Object.entries(payload).filter(
            ([_, value]) => value !== undefined,
          ),
        ),
      ),
      this.redis.set(this.domainKey(payload.domain as string), this.key()),
    ])
  }
}
