import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { UserRepository } from "@/domains/auth/users/repositories/user_repository"
import { ContainerKey } from "@/infrastructure/container"

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

  async profile(request: FastifyRequest, _: FastifyReply) {
    const user = await this.userRepository.findById(
      request.accessToken.userId,
      {
        include: {
          teams: {
            include: {
              mailers: true,
              members: true,
            },
          },
        },
      },
    )

    return user
  }
}
