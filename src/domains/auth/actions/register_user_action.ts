import type { CreateUserDto } from '@/domains/auth/users/dto/create_user_dto.js'
import { UserRepository } from '@/domains/auth/users/repositories/user_repository.js'
import { TeamRepository } from '@/domains/teams/repositories/team_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { container } from '@/utils/typi.js'

export class RegisterUserAction {
  constructor(
    private userRepository: UserRepository = container.make(UserRepository),
    private teamRepository: TeamRepository = container.make(TeamRepository),
    private database: DrizzleClient = makeDatabase(),
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
