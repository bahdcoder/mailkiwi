import { RequestPasswordResetSchema } from "@/auth/password_resets/dto/request_password_reset_dto.js"
import { ResetPasswordSchema } from "@/auth/password_resets/dto/reset_password_dto.js"
import { PasswordResetRepository } from "@/auth/password_resets/repositories/password_reset_repository.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class PasswordResetsController extends VikeController {
  constructor(
    protected app = makeApp(),
    protected passwordResetsRepository = container.make(PasswordResetRepository),
  ) {
    super()

    // request password reset (email)
    //  generate and send password reset email
    //
    // reset password (with reset token) and redirect user to login page.
    this.app.defineRoutes(
      [
        ...this.vikePath("forgot", this.page),
        ...this.vikePath("/reset/:token", this.page),
        ["POST", "forgot", this.request],
        ["POST", "reset/:token", this.reset],
      ],
      {
        prefix: "auth/passwords",
        middleware: [],
      },
    )
  }

  request = async (ctx: HonoContext) => {
    const payload = await this.validate(ctx, RequestPasswordResetSchema)

    const reset = await this.passwordResetsRepository.create(payload.email)

    if (!reset) {
      return ctx.json({ Ok: true })
    }

    // TODO: Queue email to send reset.token to user's email.

    return ctx.json({ Ok: true })
  }

  reset = async (ctx: HonoContext) => {
    const payload = await this.validate(ctx, ResetPasswordSchema)

    const { valid: isValidResetToken, user } = await this.passwordResetsRepository.confirm(payload.email, ctx.req.param("token"))

    if (!isValidResetToken) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "Failed to validate this password reset and email. Please check your email address, and make sure you clicked the correct link sent to your email.",
          field: "email",
        },
      ])
    }

    await container.make(UserRepository).update(user.id, {
      password: payload.password,
    })

    // TODO: Queue email to inform user of their new password being reset.

    return ctx.json({ Ok: true })
  }
}
