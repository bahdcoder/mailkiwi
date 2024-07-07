import { inject, injectable } from "tsyringe"

import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"

import { CreateUserDto } from "../users/dto/create_user_dto.js"
import { UserRepository } from "../users/repositories/user_repository.js"

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

    const team = await this.teamRepository.create(
      { name: payload.name },
      user.id,
    )

    return { user, team }
  }
}
