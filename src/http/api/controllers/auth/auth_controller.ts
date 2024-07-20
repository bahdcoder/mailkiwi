import { container, inject, injectable } from "tsyringe"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository.js"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action.js"
import { CreateUserSchema } from "@/domains/auth/users/dto/create_user_dto.js"
import { LoginUserSchema } from "@/domains/auth/users/dto/login_user_dto.js"
import { UserRepository } from "@/domains/auth/users/repositories/user_repository.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.ts"
import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(AccessTokenRepository)
    private accessTokenRepository: AccessTokenRepository,
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: HonoInstance,
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/login", this.login.bind(this)],
        ["POST", "/register", this.register.bind(this)],
      ],
      {
        prefix: "auth",
        middleware: [],
      },
    )
  }

  async register(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateUserSchema)

    const action = container.resolve<RegisterUserAction>(RegisterUserAction)

    const { user } = await action.handle(data)

    return ctx.json(user)
  }

  async login(ctx: HonoContext) {
    const data = await this.validate(ctx, LoginUserSchema)

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

    return ctx.json({
      ...user,
      accessToken: accessToken.toJSON(),
    })
  }
}
