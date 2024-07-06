import { inject, injectable } from "tsyringe"

import { ResetPasswordDto } from "@/domains/auth/dto/reset_password_dto.js"
import { UserRepository } from "@/domains/auth/users/repositories/user_repository.js"

@injectable()
export class ResetPasswordAction {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
  ) {}

  handle = async (_: ResetPasswordDto) => {
    // Implement action logic here
  }
}
