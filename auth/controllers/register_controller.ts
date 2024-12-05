import { EnsureUserAndTeamSessionsMiddleware } from "../middleware/ensure_user_and_team_sessions_middleware.js"
import { MustBeAuthenticatedMiddleware } from "../middleware/must_be_authenticated_middleware.js"
import { UserSessionMiddleware } from "../middleware/user_session_middleware.js"
import { ConfirmEmailVerificationCodeSchema } from "../users/dto/confirm_email_verification_code_dto.js"
import { SetUserNameSchema } from "../users/dto/set_user_name_dto.js"
import { SetUserPasswordSchema } from "../users/dto/set_user_password_dto.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { CreateUserSchema } from "@/auth/users/dto/create_user_dto.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class RegisterController extends VikeController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes([...this.vikePath("/register", this.page), ["POST", "/register", this.register.bind(this)]], {
      prefix: "auth",
      middleware: [],
    })

    this.app.defineRoutes(
      [
        ...this.vikePath("/register/profile", this.page),
        ...this.vikePath("/register/password", this.page),
        ...this.vikePath("/register/email/confirm", this.page),
        ["POST", "/register/password", this.password.bind(this)],
        ["POST", "/register/profile", this.profile.bind(this)],
        ["POST", "/register/email/confirm", this.emailConfirm.bind(this)],
      ],
      {
        prefix: "auth",
        middleware: [container.make(UserSessionMiddleware).handle, container.make(MustBeAuthenticatedMiddleware).handle],
      },
    )
  }

  async register(ctx: HonoContext) {
    const { user } = await container.resolve(RegisterUserAction).handle(await this.validate(ctx, CreateUserSchema))

    await this.session.createForUser(ctx, user.id)

    return ctx.redirect("/auth/register/email/confirm")
  }

  async profile(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserNameSchema)

    await this.userRepository.update(user.id, payload)

    return ctx.redirect("/welcome")
  }

  async emailConfirm(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, ConfirmEmailVerificationCodeSchema)

    const passed = await this.userRepository.confirmEmailVerificationCode(user, payload.code)

    if (!passed) {
      throw E_VALIDATION_FAILED([
        {
          message: "The verification code you provided was incorrect. Please check your email and try again.",
          field: "code",
        },
      ])
    }

    return ctx.redirect("/auth/register/password")
  }

  async password(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserPasswordSchema)

    await this.userRepository.update(user.id, payload)

    return ctx.redirect("/auth/register/profile")
  }
}
