import { Secret } from "@poppinss/utils"
import { count, eq } from "drizzle-orm"

import type { CreateTeamDto } from "@/teams/dto/create_team_dto.js"

import {
  broadcastGroups,
  sendingDomains,
  teamMemberships,
  teams,
  users,
} from "@/database/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

import { REDIS_KNOWN_KEYS } from "@/redis/redis_client.js"

import { container } from "@/utils/typi.js"

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

  private hasManySendingDomains = hasMany(this.database, {
    from: teams,
    to: sendingDomains,
    primaryKey: teams.id,
    foreignKey: sendingDomains.teamId,
    relationName: "sendingDomains",
  })

  async createFirstTeam(payload: CreateTeamDto, userId: string) {
    const [teamExists] = await this.teams().findAll(eq(teams.userId, userId))

    if (teamExists) return teamExists

    return this.create(payload, userId)
  }

  async create(payload: CreateTeamDto, userId: string) {
    const id = this.cuid()

    await this.database.insert(teams).values({
      id,
      userId,
      ...payload,
    })

    return { id }
  }

  async findUserFirstTeam(userId: string) {
    const [team] = await this.database
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.userId, userId))
      .limit(1)

    return team
  }

  async findUserDefaultTeam(userId: string) {
    const team = await this.hasManyMemberships((query) =>
      query
        .leftJoin(users, eq(users.id, teamMemberships.userId))
        .where(eq(teams.userId, userId))
        .limit(1),
    )

    return team[0]
  }

  async findById(teamId: string) {
    const [team] = await this.hasManyMemberships(
      (query) =>
        query
          .leftJoin(users, eq(users.id, teamMemberships.userId))
          .where(eq(teams.id, teamId)),
      (row) => ({
        ...row["teamMemberships"],
        user: row?.["users"],
      }),
    )

    return team
  }

  teams() {
    return this.crud(teams)
  }

  completedOnboarding(teamId: string) {
    const self = this

    return {
      async engage() {
        const [broadcastGroupsCount] = await self.database
          .select({ count: count() })
          .from(broadcastGroups)
          .where(eq(broadcastGroups.teamId, teamId))

        return broadcastGroupsCount.count > 0
      },
      async send() {
        // TODO: Check if user has added sending domain.
        return false
      },
    }
  }

  async findByIdWithDomains(teamId: string) {
    const self = this

    return this.cache
      .namespace("teams")
      .get(`team_with_sending_domains:${teamId}`, async function () {
        const [team] = await self.hasManySendingDomains((query) =>
          query.where(eq(teams.id, teamId)),
        )

        return team
      })
  }
}
