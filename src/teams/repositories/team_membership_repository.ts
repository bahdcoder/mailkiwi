import { and, eq, or, sql } from "drizzle-orm"
import { DateTime } from "luxon"

import {
  InsertTeamMembership,
  UpdateSetTeamMembershipInput,
} from "@/database/schema/database_schema_types.ts"
import { teamMemberships, teams, users } from "@/database/schema/schema.js"
import { belongsTo, hasOne } from "@/database/utils/relationships.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.ts"

import { container } from "@/utils/typi.ts"

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
    const result = await this.database.insert(teamMemberships).values({
      status: "PENDING",
      ...payload,
      invitedAt: DateTime.now().toJSDate(),
      expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
    })

    return { id: this.primaryKey(result) }
  }

  async membershipExists(email: string, teamId: number) {
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

  async findUserDefaultTeam(userId: number) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
      },
    })
  }

  async findById(membershipId: number) {
    const membership = await this.belongsToUser((query) =>
      query.where(eq(teamMemberships.id, membershipId)),
    )

    return membership?.[0]
  }

  async update(
    membershipId: number,
    payload: UpdateSetTeamMembershipInput,
  ) {
    return this.database
      .update(teamMemberships)
      .set(payload)
      .where(eq(teamMemberships.id, membershipId))
  }

  async delete(membershipId: number) {
    return this.database
      .delete(teamMemberships)
      .where(eq(teamMemberships.id, membershipId))
  }

  async findBySignedUrlToken(token: string) {
    const decodedToken = container.make(SignedUrlManager).decode(token)

    if (!decodedToken) {
      return null
    }

    const invite = await this.findById(parseInt(decodedToken.original))

    return invite
  }
}
