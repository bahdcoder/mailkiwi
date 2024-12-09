import { ConfirmEmailVerificationCodeSchema } from "../users/dto/confirm_email_verification_code_dto.js"
import { SetUserNameSchema } from "../users/dto/set_user_name_dto.js"
import { SetUserPasswordSchema } from "../users/dto/set_user_password_dto.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { CreateUserSchema } from "@/auth/users/dto/create_user_dto.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import { middleware } from "@/shared/middleware/middleware_aliases.js"
import { route } from "@/shared/routes/route_aliases.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class RegisterController extends VikeController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes(
      [
        ...this.vikePath(route("auth_register"), this.page),
        ["POST", route("auth_register"), this.register.bind(this)],
      ],
      {
        prefix: "",
        middleware: [],
      },
    )

    this.app.defineRoutes(
      [
        ...this.vikePath(route("auth_register_profile"), this.page),
        ...this.vikePath(route("auth_register_password"), this.page),
        ...this.vikePath(route("auth_register_email_confirm"), this.page),
        ["POST", route("auth_register_password"), this.password.bind(this)],
        ["POST", route("auth_register_profile"), this.profile.bind(this)],
        ["POST", route("auth_register_email_confirm"), this.emailConfirm.bind(this)],
      ],
      {
        prefix: "",
        middleware: [middleware("user_session"), middleware("must_be_authenticated")],
      },
    )
  }

  async register(ctx: HonoContext) {
    const { user, plainEmailVerificationCode } = await container
      .resolve(RegisterUserAction)
      .handle(await this.validate(ctx, CreateUserSchema))

    d({ plainEmailVerificationCode })

    await this.session.createForUser(ctx, user.id)

    return this.response(ctx).redirect(route("auth_register_email_confirm")).send()
  }

  async profile(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserNameSchema)

    await this.userRepository.update(user.id, payload)

    return ctx.redirect(route("welcome"))
  }

  async redirectUserToCorrectOnboardingPage(ctx: HonoContext) {
    // stages of onboarding:
    // 1. pending email verification
    // 2. pending password setting
  }

  async emailConfirm(ctx: HonoContext) {
    const user = ctx.get("user")

    if (user.emailVerifiedAt) {
      return this.response(ctx).redirect(route("welcome")).send()
    }

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

    return this.response(ctx).redirect(route("auth_register_password")).send()
  }

  async password(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserPasswordSchema)

    await this.userRepository.update(user.id, payload)

    return ctx.redirect(route("auth_register_profile"))
  }
}
