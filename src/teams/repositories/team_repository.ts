import { eq } from 'drizzle-orm'

import { BaseRepository } from '@/shared/repositories/base_repository.js'

import { makeDatabase } from '@/shared/container/index.js'
import type { DrizzleClient } from '@/database/client.js'
import { teams } from '@/database/schema/schema.js'

import type { CreateTeamDto } from '@/teams/dto/create_team_dto.js'

export class TeamRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
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
}
