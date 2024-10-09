import { apiEnv } from "@/api/env/api_env.js"
import { and, eq, or, sql } from "drizzle-orm"
import { DateTime } from "luxon"

import {
  InsertTeamMembership,
  UpdateSetTeamMembershipInput,
} from "@/database/schema/database_schema_types.js"
import { teamMemberships, teams, users } from "@/database/schema/schema.js"
import { belongsTo, hasOne } from "@/database/utils/relationships.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

export class TeamMembershipRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  private belongsToUser = belongsTo(this.database, {
    from: teamMemberships,
    to: users,
    primaryKey: users.id,
    foreignKey: teamMemberships.userId,
    relationName: "user",
  })

  async create(payload: InsertTeamMembership) {
    const id = this.cuid()
    await this.database.insert(teamMemberships).values({
      id,
      status: "PENDING",
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

  async findById(membershipId: string) {
    const [membership] = await this.belongsToUser((query) =>
      query.where(eq(teamMemberships.id, membershipId)),
    )

    return membership
  }

  async update(
    membershipId: string,
    payload: UpdateSetTeamMembershipInput,
  ) {
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
    const decodedToken = new SignedUrlManager(apiEnv.APP_KEY).decode(token)

    if (!decodedToken) {
      return null
    }

    const invite = await this.findById(decodedToken.original)

    return invite
  }
}
