import { PrismaClient } from "@prisma/client"
import { container, inject, injectable } from "tsyringe"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { ContainerKey } from "@/infrastructure/container.js"

import { CreateUserDto } from "../users/dto/create_user_dto.js"
import { UserRepository } from "../users/repositories/user_repository.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"

@injectable()
export class RegisterUserAction {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
    @inject(ContainerKey.database)
    private database: DrizzleClient,
  ) {}

  handle = async (payload: CreateUserDto) => {
    const user = await this.userRepository.create(payload)

    const allUsers = await this.database.query.users.findMany()

    const team = await this.teamRepository.create(
      { name: payload.name },
      user.id,
    )

    return { user, team }
  }
}
