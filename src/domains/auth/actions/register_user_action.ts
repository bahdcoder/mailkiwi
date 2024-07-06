import { PrismaClient } from "@prisma/client"
import { container, inject, injectable } from "tsyringe"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { ContainerKey } from "@/infrastructure/container.js"

import { CreateUserDto } from "../users/dto/create_user_dto.js"
import { UserRepository } from "../users/repositories/user_repository.js"

@injectable()
export class RegisterUserAction {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
  ) {}

  handle = async (payload: CreateUserDto) => {
    const database = container.resolve<PrismaClient>(ContainerKey.database)

    const { user, team } = await database.$transaction(async (tx) => {
      const user = await this.userRepository.transaction(tx).create(payload)

      const team = await this.teamRepository
        .transaction(tx)
        .create({ name: payload.name }, user.id)

      return { user, team }
    })

    return { user, team }
  }
}
