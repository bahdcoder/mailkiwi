import { eq } from "drizzle-orm"

import type { CreateUserDto } from "@/auth/users/dto/create_user_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { teams, users } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"

export class UserRepository extends ScryptTokenRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  private hasManyTeams = hasMany(this.database, {
    from: users,
    to: teams,
    primaryKey: users.id,
    foreignKey: teams.userId,
    relationName: "teams",
  })

  async create(user: CreateUserDto) {
    const id = this.cuid()

    await this.database
      .insert(users)
      .values({
        id,
        ...user,
        password: await this.hash(user.password),
      })
      .execute()

    return { id }
  }

  async findByEmail(email: string) {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user
  }

  async findById(id: string) {
    const userWithTeams = await this.hasManyTeams((query) =>
      query.where(eq(users.id, id)),
    )

    return userWithTeams[0]
  }
}
