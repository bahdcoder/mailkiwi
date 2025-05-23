import { audiences, creditPurchases, emailSends } from '#root/database/schema.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { and, eq, gt, sql, sum } from 'drizzle-orm'
import { DateTime } from 'luxon'

export class TeamCreditRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async totalConsumedCredits(teamId: string): Promise<number> {
    const [result] = await this.database
      .select({
        total: sql<number>`COALESCE(COUNT(*), 0)`,
      })
      .from(emailSends)
      .innerJoin(audiences, eq(emailSends.audienceId, audiences.id))
      .where(eq(audiences.teamId, teamId))

    return result.total
  }

  async totalAvailableCredits(teamId: string): Promise<number> {
    const [result] = await this.database
      .select({
        total: sql<number>`COALESCE(${sum(creditPurchases.amount)}, 0)`,
      })
      .from(creditPurchases)
      .where(
        and(
          eq(creditPurchases.teamId, teamId),
          eq(creditPurchases.status, 'successful'),
          gt(creditPurchases.expiresAt, DateTime.now().toJSDate()),
        ),
      )

    return result.total
  }
}
