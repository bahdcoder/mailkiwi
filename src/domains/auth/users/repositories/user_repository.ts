import cuid2 from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'

import type { CreateUserDto } from '@/domains/auth/users/dto/create_user_dto.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { scrypt } from '@/domains/shared/utils/hash/scrypt.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { users } from '@/infrastructure/database/schema/schema.js'
import type {
  FindUserByIdArgs,
  User,
} from '@/infrastructure/database/schema/types.js'

export class UserRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(user: CreateUserDto) {
    const id = cuid2.createId()

    await this.database
      .insert(users)
      .values({
        ...user,
        id,
        password: await scrypt().make(user.password),
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

  async authenticateUserPassword(user: User | undefined, password: string) {
    if (!user) {
      return null
    }

    return scrypt().verify(user.password, password)
  }
}
