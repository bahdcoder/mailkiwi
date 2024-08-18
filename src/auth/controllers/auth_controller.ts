import { AccessTokenRepository } from '@/auth/acess_tokens/repositories/access_token_repository.js'
import { RegisterUserAction } from '@/auth/actions/register_user_action.js'
import { CreateUserSchema } from '@/auth/users/dto/create_user_dto.js'
import { LoginUserSchema } from '@/auth/users/dto/login_user_dto.js'
import { UserRepository } from '@/auth/users/repositories/user_repository.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'
import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import { makeApp } from '@/shared/container/index.js'
import type { HonoInstance } from '@/server/hono.js'
import type { HonoContext } from '@/server/types.js'
import { container } from '@/utils/typi.js'
import { CreateTeamAccessTokenAction } from '@/auth/actions/create_team_access_token.ts'

export class AuthController extends BaseController {
  constructor(
    private userRepository = container.make(UserRepository),
    private accessTokenRepository = container.make(AccessTokenRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/login', this.login.bind(this)],
        ['POST', '/register', this.register.bind(this)],
      ],
      {
        prefix: 'auth',
        middleware: [],
      },
    )

    this.app.defineRoutes(
      [['POST', '/api-keys', this.createApiKey.bind(this)]],
      {
        prefix: 'auth',
      },
    )
  }

  async register(ctx: HonoContext) {
    const { user } = await container
      .resolve(RegisterUserAction)
      .handle(await this.validate(ctx, CreateUserSchema))

    return ctx.json(user)
  }

  async createApiKey(ctx: HonoContext) {
    const accessToken = await container
      .make(CreateTeamAccessTokenAction)
      .handle(ctx.get('team').id)

    return ctx.json(accessToken.toJSON())
  }

  async login(ctx: HonoContext) {
    const data = await this.validate(ctx, LoginUserSchema)

    const user = await this.userRepository.findByEmail(data.email)

    const passwordIsValid = await this.userRepository.authenticateUserPassword(
      user,
      data.password,
    )

    if (!user || !passwordIsValid) {
      throw E_VALIDATION_FAILED([
        {
          message: 'These credentials do not match our records.',
          field: 'email',
        },
      ])
    }

    const accessToken = await this.accessTokenRepository.createAccessToken(user)

    return ctx.json({
      ...user,
      accessToken: accessToken.toJSON(),
    })
  }
}
