import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js"

import { teams } from "@/database/schema/schema.js"

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

  async create(payload: CreateTeamDto, userId: string) {
    const id = this.cuid()

    await this.database.insert(teams).values({
      ...payload,
      id,
      userId,
    })

    return { id }
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
      },
    })
  }

  async findById(teamId: string) {
    const team = await this.database.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
      },
    })

    return team
  }

  usage(teamId: string) {
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
  private teamId: string

  constructor(private redis = makeRedis()) {}

  forTeam(teamId: string) {
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
