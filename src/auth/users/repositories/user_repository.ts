import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"

import type { CreateUserDto } from "@/auth/users/dto/create_user_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import type {
  FindUserByIdArgs,
  User,
} from "@/database/schema/database_schema_types.js"
import { users } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class UserRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(user: CreateUserDto) {
    const id = this.cuid()

    await this.database
      .insert(users)
      .values({
        ...user,
        id,
        password: await bcrypt.hash(user.password, 10),
      })
      .execute()

    return { id }
  }

  async findByEmail(email: string) {
    return this.database.query.users.findFirst({
      where: eq(users.email, email),
    })
  }

  async findById(id?: string | null, args?: FindUserByIdArgs) {
    if (!id) return null

    return this.database.query.users.findFirst({
      where: eq(users.id, id),
      ...args,
    })
  }

  async authenticateUserPassword(
    user: User | undefined,
    password: string,
  ) {
    if (!user) {
      return null
    }

    return bcrypt.compare(password, user.password)
  }
}
