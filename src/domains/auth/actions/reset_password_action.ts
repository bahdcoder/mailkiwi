import type { ResetPasswordDto } from '@/domains/auth/dto/reset_password_dto.js'
import { UserRepository } from '@/domains/auth/users/repositories/user_repository.js'
import { container } from '@/utils/typi.js'

export class ResetPasswordAction {
  constructor(
    private userRepository: UserRepository = container.make(UserRepository),
  ) {}

  handle = async (_: ResetPasswordDto) => {
    // Implement action logic here
  }
}
