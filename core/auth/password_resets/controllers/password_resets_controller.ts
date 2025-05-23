import { appEnv } from '#root/core/app/env/app_env.js'

import { RequestPasswordResetSchema } from '#root/core/auth/password_resets/dto/request_password_reset_dto.js'
import { ResetPasswordSchema } from '#root/core/auth/password_resets/dto/reset_password_dto.js'
import { PasswordResetRepository } from '#root/core/auth/password_resets/repositories/password_reset_repository.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * PasswordResetsController handles password recovery and reset functionality.
 *
 * This controller is responsible for:
 * 1. Initiating password reset requests via email
 * 2. Validating password reset tokens
 * 3. Processing password changes during reset flows
 *
 * The password reset flow provides a secure way for users to regain access
 * to their accounts when they've forgotten their passwords, while maintaining
 * security and preventing unauthorized access.
 */
export class PasswordResetsController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected passwordResetsRepository = container.make(PasswordResetRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['POST', 'forgot', this.request],
        ['POST', 'reset/:token', this.reset],
      ],
      {
        prefix: 'auth/passwords',
        middleware: [],
      },
    )
  }

  /**
   * Initiates a password reset request.
   *
   * Creates a password reset token for the specified email address
   * and prepares to send a reset link to the user. For security,
   * returns a success response regardless of whether the email exists.
   */
  request = async (ctx: HonoContext) => {
    const payload = await this.validate(ctx, RequestPasswordResetSchema)

    const reset = await this.passwordResetsRepository.create(payload.email)

    if (!reset) {
      return ctx.json({ Ok: true })
    }

    // TODO: Queue email to send reset.token to user's email.
    if (appEnv.isDev) {
      d({ reset })
    }

    return ctx.json({ Ok: true })
  }

  /**
   * Completes a password reset with a valid token.
   *
   * Validates the reset token, confirms the user's identity,
   * and sets a new password for the account. This is the final
   * step in the password recovery process.
   */
  reset = async (ctx: HonoContext) => {
    const payload = await this.validate(ctx, ResetPasswordSchema)

    if (payload.password !== payload.passwordConfirm) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Please make sure your confirm password matches your chosen password.',
          field: 'passwordConfirm',
        },
      ])
    }

    const { valid: isValidResetToken, user } =
      await this.passwordResetsRepository.confirm(payload.email, ctx.req.param('token'))

    if (!isValidResetToken) {
      throw E_VALIDATION_FAILED([
        {
          message:
            'Failed to validate this password reset and email. Please check your email address, and make sure you clicked the correct link sent to your email.',
          field: 'email',
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
