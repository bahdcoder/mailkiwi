import { ChangePasswordSchema } from '#root/core/auth/users/dto/change_password_dto.js'
import { ConfirmEmailChangeSchema } from '#root/core/auth/users/dto/confirm_email_change_dto.js'
import { InitiateEmailChangeSchema } from '#root/core/auth/users/dto/initiate_email_change_dto.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * UserController manages user profile information.
 *
 * This controller is responsible for:
 * 1. Retrieving user profile data
 * 2. Providing endpoints for user self-service
 * 3. Managing password changes for authenticated users
 * 4. Managing email address changes with verification
 *
 * The controller enables users to access and manage their own account
 * information, supporting user autonomy and self-service capabilities.
 */
export class UserController extends BaseController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()
    this.app.defineRoutes(
      [
        ['GET', '/profile', this.profile.bind(this)],
        ['POST', '/passwords/change', this.changePassword.bind(this)],
        ['POST', '/email/change/initiate', this.initiateEmailChange.bind(this)],
        ['POST', '/email/change/confirm', this.confirmEmailChange.bind(this)],
        ['DELETE', '/email/change/cancel', this.cancelEmailChange.bind(this)],
      ],
      {
        prefix: 'auth',
      },
    )
  }

  /**
   * Retrieves the authenticated user's profile information.
   *
   * Returns detailed user data for the currently authenticated user,
   * including personal information and account settings.
   */
  async profile(ctx: HonoContext) {
    const user = await this.userRepository.findById(this.user(ctx).id)

    return ctx.json(user)
  }

  /**
   * Changes the authenticated user's password.
   *
   * This method allows users to update their password by providing:
   * 1. Their current password for verification
   * 2. A new password that meets security requirements
   * 3. Confirmation of the new password
   *
   * The method validates the current password, ensures the new password
   * meets security standards, and updates the user's password in the database.
   */
  async changePassword(ctx: HonoContext) {
    const data = await this.validate(ctx, ChangePasswordSchema)

    if (data.newPassword !== data.confirmNewPassword) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Please make sure your confirm password matches your new password.',
          field: 'confirmNewPassword',
        },
      ])
    }

    const user = await this.userRepository.findById(this.user(ctx).id)

    if (!user?.password) {
      throw E_VALIDATION_FAILED([
        {
          message:
            'You cannot change your password as you signed in using an OAuth provider.',
          field: 'password',
        },
      ])
    }

    const currentPasswordIsValid = await this.userRepository.verify(
      data.password,
      user.password,
    )

    if (!currentPasswordIsValid) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Your current password is incorrect.',
          field: 'password',
        },
      ])
    }

    await this.userRepository.update(user.id, {
      password: data.newPassword,
    })

    return this.response(ctx).json({ message: 'Password changed successfully' }).send()
  }

  /**
   * Initiates an email change process for the authenticated user.
   *
   * This method starts the email change workflow by:
   * 1. Validating the new email address format and business rules
   * 2. Generating a verification code and storing it with the new email
   * 3. Sending the verification code to the new email address
   *
   * The current email remains unchanged and verified throughout this process.
   * Users can abandon the change without affecting their current email status.
   */
  async initiateEmailChange(ctx: HonoContext) {
    const data = await this.validate(ctx, InitiateEmailChangeSchema)
    const user = await this.userRepository.findById(this.user(ctx).id)

    if (!user) {
      throw E_VALIDATION_FAILED([
        {
          message: 'User not found.',
        },
      ])
    }

    if (data.email === user.email) {
      throw E_VALIDATION_FAILED([
        {
          message: 'The new email address must be different from your current email.',
          field: 'email',
        },
      ])
    }

    const existingUser = await this.userRepository.findByEmail(data.email)
    if (existingUser) {
      throw E_VALIDATION_FAILED([
        {
          message: 'This email address is already in use by another account.',
          field: 'email',
        },
      ])
    }

    await this.userRepository.initiateEmailChange(user.id, data.email)

    return this.response(ctx)
      .json({
        message: 'Verification code sent to your new email address',
      })
      .send()
  }

  /**
   * Confirms an email change with the verification code.
   *
   * This method completes the email change process by:
   * 1. Verifying the provided code against the stored hash
   * 2. Atomically updating the user's email address
   * 3. Marking the new email as verified
   * 4. Clearing all verification fields
   */
  async confirmEmailChange(ctx: HonoContext) {
    const data = await this.validate(ctx, ConfirmEmailChangeSchema)
    const user = await this.userRepository.findById(this.user(ctx).id)

    if (!user?.unconfirmedEmail) {
      throw E_VALIDATION_FAILED([
        {
          message:
            'No email change request found. Please initiate an email change first.',
          field: 'code',
        },
      ])
    }

    const success = await this.userRepository.confirmEmailChange(user.id, data.code)

    if (!success) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invalid or expired verification code. Please try again.',
          field: 'code',
        },
      ])
    }

    return this.response(ctx)
      .json({
        message: 'Email address updated successfully',
      })
      .send()
  }

  /**
   * Cancels a pending email change request.
   *
   * This method allows users to abandon an email change process by clearing
   * the pending email and verification fields. The current email and its
   * verification status remain completely unchanged.
   */
  async cancelEmailChange(ctx: HonoContext) {
    const user = await this.userRepository.findById(this.user(ctx).id)

    if (!user?.unconfirmedEmail) {
      throw E_VALIDATION_FAILED([
        {
          message: 'No email change request found to cancel.',
        },
      ])
    }

    await this.userRepository.cancelEmailChange(user.id)

    return this.response(ctx)
      .json({
        message: 'Email change request cancelled successfully',
      })
      .send()
  }
}
