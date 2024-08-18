import type { CreateUserDto } from '@/auth/users/dto/create_user_dto.js'
import { UserRepository } from '@/auth/users/repositories/user_repository.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'
import { makeDatabase } from '@/shared/container/index.js'
import type { DrizzleClient } from '@/database/client.js'
import { container } from '@/utils/typi.js'

export class RegisterUserAction {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamRepository = container.make(TeamRepository),
    private database: DrizzleClient = makeDatabase(),
  ) {}

  handle = async (payload: CreateUserDto) => {
    const { user, team } = await this.database.transaction(async (tx) => {
      const user = await this.userRepository.transaction(tx).create(payload)

      const team = await this.teamRepository
        .transaction(tx)
        .create({ name: payload.name }, user.id)

      return { user, team }
    })

    return { user, team }
  }
}
