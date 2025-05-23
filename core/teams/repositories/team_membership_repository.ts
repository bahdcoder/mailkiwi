import { appEnv } from '#root/core/app/env/app_env.js'
import { and, eq, or, sql } from 'drizzle-orm'
import { DateTime } from 'luxon'

import type {
  InsertTeamMembership,
  UpdateSetTeamMembershipInput,
} from '#root/database/database_schema_types.js'
import { teamMemberships, teams, users } from '#root/database/schema.js'
import { belongsTo } from '#root/database/utils/relationships.js'

import { makeDatabase, makeRedis } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

export class TeamMembershipRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  memberships() {
    return this.crud(teamMemberships)
  }

  private belongsToUser() {
    return belongsTo(this.database, {
      from: teamMemberships,
      to: users,
      primaryKey: users.id,
      foreignKey: teamMemberships.userId,
      relationName: 'user',
    })
  }

  private belongsToTeam() {
    return belongsTo(this.database, {
      from: teamMemberships,
      to: teams,
      primaryKey: teams.id,
      foreignKey: teamMemberships.teamId,
      relationName: 'team',
    })
  }

  async create(payload: InsertTeamMembership) {
    const id = this.cuid()
    await this.database.insert(teamMemberships).values({
      id,
      status: 'PENDING',
      ...payload,
      invitedAt: DateTime.now().toJSDate(),
      expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
    })

    return { id }
  }

  async membershipExists(email: string, teamId: string) {
    const membership = await this.database
      .select()
      .from(teamMemberships)
      .leftJoin(users, eq(users.id, teamMemberships.userId))
      .where(
        and(
          or(
            eq(teamMemberships.email, email),
            and(
              sql`${teamMemberships.userId} IS NOT NULL`,
              eq(teamMemberships.email, email),
            ),
          ),
          eq(teamMemberships.teamId, teamId),
        ),
      )
      .limit(1)

    return membership.length > 0
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
      },
    })
  }

  async findAllForUser(userId: string) {
    return this.belongsToTeam()((query) =>
      query.where(
        and(eq(teamMemberships.userId, userId), eq(teamMemberships.status, 'ACTIVE')),
      ),
    )
  }

  async findById(membershipId: string) {
    const [membership] = await this.belongsToUser()((query) =>
      query.where(eq(teamMemberships.id, membershipId)),
    )

    return membership
  }

  async update(membershipId: string, payload: UpdateSetTeamMembershipInput) {
    return this.database
      .update(teamMemberships)
      .set(payload)
      .where(eq(teamMemberships.id, membershipId))
  }

  async delete(membershipId: string) {
    return this.database
      .delete(teamMemberships)
      .where(eq(teamMemberships.id, membershipId))
  }

  async findBySignedUrlToken(token: string) {
    const decodedToken = new SignedUrlManager(appEnv.APP_KEY).decode(token)

    if (!decodedToken) {
      return null
    }

    const invite = await this.findById(decodedToken.original)

    return invite
  }
}
