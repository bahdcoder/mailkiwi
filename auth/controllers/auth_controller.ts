import { EnsureUserAndTeamSessionsMiddleware } from "../middleware/ensure_user_and_team_sessions_middleware.js"
import { UserSessionMiddleware } from "../middleware/user_session_middleware.js"
import { ConfirmEmailVerificationCodeSchema } from "../users/dto/confirm_email_verification_code_dto.js"
import { SetUserPasswordSchema } from "../users/dto/set_user_password_dto.js"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"
import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { CreateUserSchema } from "@/auth/users/dto/create_user_dto.js"
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
        ["POST", "/register", this.register.bind(this)],
      ],
      {
        prefix: "auth",
        middleware: [],
      },
    )

    this.app.defineRoutes(
      [
        ...this.vikePath("/register/password", this.page),
        ...this.vikePath("/register/email/confirm", this.page),
        ["POST", "/register/password", this.registerPassword.bind(this)],
        ["POST", "/register/email/confirm", this.registerEmailConfirm.bind(this)],
      ],
      {
        prefix: "auth",
        middleware: [
          container.make(UserSessionMiddleware).handle,
          container.make(EnsureUserAndTeamSessionsMiddleware).handle,
        ],
      },
    )

    this.app.defineRoutes([["POST", "/api-keys", this.createApiKey.bind(this)]], {
      prefix: "auth",
    })
  }

  async register(ctx: HonoContext) {
    const { user } = await container
      .resolve(RegisterUserAction)
      .handle(await this.validate(ctx, CreateUserSchema))

    await this.session.createForUser(ctx, user.id)

    return ctx.redirect("/auth/register/email/confirm")
  }

  async registerEmailConfirm(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, ConfirmEmailVerificationCodeSchema)

    const passed = await this.userRepository.confirmEmailVerificationCode(
      user,
      payload.code,
    )

    if (!passed) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "The verification code you provided was incorrect. Please check your email and try again.",
          field: "code",
        },
      ])
    }

    // await this.userRepository.update(user.id, {
    //   // password: payload.,
    // })

    return ctx.redirect("/auth/register/password")
  }

  async registerPassword(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserPasswordSchema)

    await this.userRepository.update(user.id, payload)

    return ctx.redirect("/welcome")
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

    return ctx.json({
      Ok: true,
    })
  }

  logout = async (ctx: HonoContext) => {
    await this.session.clearForUser(ctx, "user")

    return ctx.json({
      Ok: true,
    })
  }
}
