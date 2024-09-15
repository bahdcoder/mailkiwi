import { eq } from "drizzle-orm"

import { emailContents, emails } from "@/database/schema/schema.js"
import { belongsTo } from "@/database/utils/relationships.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class EmailRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  private belongsToEmailContent = belongsTo(this.database, {
    from: emails,
    to: emailContents,
    primaryKey: emailContents.id,
    foreignKey: emails.emailContentId,
    relationName: "emailContent",
  })

  async findById(emailId: number) {
    const [email] = await this.belongsToEmailContent((query) =>
      query.where(eq(emails.id, emailId)),
    )

    return email
  }
}
