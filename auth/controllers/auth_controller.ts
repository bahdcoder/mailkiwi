import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"
import { LoginUserSchema } from "@/auth/users/dto/login_user_dto.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class AuthController extends VikeController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes(
      [
        ...this.vikePath("/login", this.page),
        ["POST", "/login", this.login],
        ["POST", "/logout", this.logout],
      ],
      {
        prefix: "auth",
        middleware: [],
      },
    )

    this.app.defineRoutes([["POST", "/api-keys", this.createApiKey.bind(this)]], {
      prefix: "auth",
    })
  }

  async createApiKey(ctx: HonoContext) {
    const { apiKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(ctx.get("team").id)

    return ctx.json({ apiKey })
  }

  login = async (ctx: HonoContext) => {
    const data = await this.validate(ctx, LoginUserSchema)

    const user = await this.userRepository.findByEmail(data.email)

    const invalidCredentials = [
      {
        message: "These credentials do not match our records.",
        field: "email",
      },
    ]

    if (!user) {
      throw E_VALIDATION_FAILED(invalidCredentials)
    }

    const passwordIsValid = await this.userRepository.verify(
      data.password,
      user.password as string,
    )

    if (!passwordIsValid) {
      throw E_VALIDATION_FAILED(invalidCredentials)
    }

    await this.session.createForUser(ctx, user.id)

    return ctx.redirect("/")
  }

  logout = async (ctx: HonoContext) => {
    await this.session.clearForUser(ctx, "user")

    return ctx.json({
      Ok: true,
    })
  }
}
