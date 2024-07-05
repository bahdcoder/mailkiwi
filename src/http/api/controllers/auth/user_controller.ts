import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify"
import { container, inject, injectable } from "tsyringe"

import { UserRepository } from "@/domains/auth/users/repositories/user_repository"
import { GetMailerAction } from "@/domains/teams/actions/mailers/get_mailer_action"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class UserController {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [["GET", "/profile", this.profile.bind(this) as RouteHandlerMethod]],
      {
        prefix: "auth",
      },
    )
  }

  async profile(request: FastifyRequest, _: FastifyReply) {
    const getMailerAction = container.resolve(GetMailerAction)

    // Sync mailer identity statuses from AWS.
    try {
      await getMailerAction.handle(request.team)
    } catch (error) {
      //
    }

    const user = await this.userRepository.findById(
      request.accessToken.userId,
      {
        include: {
          teams: {
            include: {
              mailer: {
                include: {
                  identities: true,
                },
              },
              members: true,
            },
          },
        },
      },
    )

    return user
  }
}
