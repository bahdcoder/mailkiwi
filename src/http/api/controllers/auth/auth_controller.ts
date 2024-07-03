import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action"
import { CreateUserSchema } from "@/domains/auth/users/dto/create_user_dto"
import { LoginUserSchema } from "@/domains/auth/users/dto/login_user_dto"
import { UserRepository } from "@/domains/auth/users/repositories/user_repository"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"
import { E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class AuthController {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(AccessTokenRepository)
    private accessTokenRepository: AccessTokenRepository,
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes(
      [
        ["POST", "/login", this.login.bind(this)],
        ["POST", "/register", this.register.bind(this)],
      ],
      {
        prefix: "auth",
        onRequestHooks: [],
      },
    )
  }

  async register(request: FastifyRequest, _: FastifyReply) {
    const { success, error, data } = await CreateUserSchema.safeParseAsync(
      request.body,
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const action = container.resolve<RegisterUserAction>(RegisterUserAction)

    const { user } = await action.handle(data)

    return user
  }

  async login(request: FastifyRequest, _: FastifyReply) {
    const { success, error, data } = await LoginUserSchema.safeParseAsync(
      request.body,
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    const user = await this.userRepository.findByEmail(data.email)

    const passwordIsValid = await this.userRepository.authenticateUserPassword(
      user,
      data.password,
    )

    if (!user || !passwordIsValid) {
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "These credentials do not match our records.",
            path: ["email"],
          },
        ],
      })
    }

    const accessToken = await this.accessTokenRepository.createAccessToken(user)

    return {
      ...user,
      accessToken: accessToken.toJSON(),
    }
  }
}
