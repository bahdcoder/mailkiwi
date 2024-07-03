import { inject, injectable } from "tsyringe"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

import { ContainerKey } from "@/infrastructure/container"
import { UserRepository } from "@/domains/auth/users/repositories/user_repository"

@injectable()
export class UserController {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes([["GET", "/profile", this.profile.bind(this)]], {
      prefix: "auth",
    })
  }

  async profile(request: FastifyRequest, response: FastifyReply) {
    const user = await this.userRepository.findById(request.accessToken.userId)

    return { user }
  }
}
