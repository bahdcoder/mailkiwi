import { Prisma, PrismaClient, User } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { CreateUserDto } from "@/domains/auth/users/dto/create_user_dto.js"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { scrypt } from "@/domains/shared/utils/hash/scrypt.ts"
import { ContainerKey } from "@/infrastructure/container.js"

@injectable()
export class UserRepository extends BaseRepository {
  constructor(@inject(ContainerKey.database) protected database: PrismaClient) {
    super()
  }

  async create(user: CreateUserDto) {
    return this.database.user.create({
      data: {
        ...user,
        password: await scrypt().make(user.password),
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: false,
      },
    })
  }

  async findByEmail(email: string) {
    return this.database.user.findFirst({
      where: {
        email,
      },
    })
  }

  async findById(
    id?: string | null,
    args?: Partial<Prisma.UserFindUniqueArgs>,
  ) {
    if (!id) return null

    return this.database.user.findFirst({
      where: {
        id,
      },
      ...args,
    })
  }

  async authenticateUserPassword(user: User | null, password: string) {
    if (!user) {
      return null
    }

    return scrypt().verify(user.password, password)
  }
}
