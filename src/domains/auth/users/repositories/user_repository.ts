import { Prisma, PrismaClient, User } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { CreateUserDto } from "@/domains/auth/users/dto/create_user_dto.js"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { scrypt } from "@/domains/shared/utils/hash/scrypt.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { users } from "@/infrastructure/database/schema/schema.ts"
import { eq } from "drizzle-orm"
import cuid2 from "@paralleldrive/cuid2"

@injectable()
export class UserRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
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

  async findById(
    id?: string | null,
    args?: Partial<Prisma.UserFindUniqueArgs>,
  ) {
    if (!id) return null

    return this.database.query.users.findFirst({
      where: eq(users.id, id),
      // ...args,
    })
  }

  async authenticateUserPassword(user: User | null, password: string) {
    if (!user) {
      return null
    }

    return scrypt().verify(user.password, password)
  }
}
