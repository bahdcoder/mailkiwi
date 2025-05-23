import type { ResetPasswordDto } from '#root/core/auth/dto/reset_password_dto.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { container } from '#root/core/utils/typi.js'

export class ResetPasswordAction {
  constructor(private userRepository: UserRepository = container.make(UserRepository)) {}

  handle = async (_: ResetPasswordDto) => {
    // Implement action logic here
  }
}
