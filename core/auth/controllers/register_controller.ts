import { appEnv } from '#root/core/app/env/app_env.js'
import type { Next } from 'hono'
import { ConfirmEmailVerificationCodeSchema } from '../users/dto/confirm_email_verification_code_dto.js'
import { SetUserNameSchema } from '../users/dto/set_user_name_dto.js'
import { SetUserPasswordSchema } from '../users/dto/set_user_password_dto.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { RegisterUserAction } from '#root/core/auth/actions/register_user_action.js'
import { CreateUserSchema } from '#root/core/auth/users/dto/create_user_dto.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp, makeDatabase } from '#root/core/shared/container/index.js'
import { middleware } from '#root/core/shared/middleware/middleware_aliases.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { Session } from '#root/core/shared/sessions/sessions.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'

/**
 * RegisterController handles the user registration process.
 *
 * This controller is responsible for:
 * 1. Creating new user accounts with email verification
 * 2. Managing the multi-step registration flow
 * 3. Setting up user profiles, passwords, and initial team
 * 4. Verifying email addresses via confirmation codes
 *
 * The registration process is designed as a guided flow that ensures
 * users complete all necessary steps while maintaining security and
 * data integrity throughout the account creation process.
 */
export class RegisterController extends BaseController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes([['POST', route('auth_register'), this.register.bind(this)]], {
      prefix: '',
      middleware: [],
    })

    this.app.defineRoutes(
      [
        ['POST', route('auth_register_password'), this.password.bind(this)],
        ['POST', route('auth_register_profile'), this.profile.bind(this)],
        ['POST', route('auth_register_email_confirm'), this.emailConfirm.bind(this)],
      ],
      {
        prefix: '',
        middleware: [middleware('user_session'), middleware('must_be_authenticated')],
      },
    )
  }

  /**
   * Initiates the user registration process.
   *
   * Creates a new user account with the provided email address,
   * generates an email verification code, and redirects to the
   * email confirmation step of the registration flow.
   */
  async register(ctx: HonoContext) {
    const { user, plainEmailVerificationCode, teamId } = await container
      .resolve(RegisterUserAction)
      .handle(await this.validate(ctx, CreateUserSchema))

    if (appEnv.isDev) {
      // Log verification code in development for testing
      d({ plainEmailVerificationCode })
    }

    await this.session.createForUser(ctx, {
      userId: user.id,
    })

    await container.make(Session).updateCurrentSessionTeamId(ctx, teamId)

    return this.response(ctx).redirect(route('auth_register_email_confirm')).send()
  }

  /**
   * Completes the user profile setup.
   *
   * Updates the user's name and team name, creates an initial audience,
   * and finalizes the registration process. This is typically the final
   * step in the registration flow before the user reaches the application.
   */
  async profile(ctx: HonoContext) {
    const user = ctx.get('user')
    const team = ctx.get('team')

    const payload = await this.validate(ctx, SetUserNameSchema)

    await makeDatabase().transaction(async (trx) => {
      await Promise.all([
        this.userRepository.transaction(trx).update(user.id, payload),
        container.make(TeamRepository).transaction(trx).teams().update(team?.id, {
          name: payload.teamName,
        }),
      ])

      await Promise.all([
        container.make(AudienceRepository).audiences().create({
          name: payload.teamName,
          teamId: team.id,
        }),
        new Session().updateCurrentSessionTeamId(ctx, team.id),
      ])

      return { team }
    })

    return this.response(ctx).redirect(route('welcome')).send()
  }

  /**
   * Verifies the user's email address with a confirmation code.
   *
   * Validates the verification code entered by the user against the
   * code sent to their email address. Upon successful verification,
   * marks the email as verified and proceeds to the password setup step.
   */
  async emailConfirm(ctx: HonoContext) {
    const user = ctx.get('user')

    if (user.emailVerifiedAt) {
      return this.response(ctx).redirect(route('welcome')).send()
    }

    const payload = await this.validate(ctx, ConfirmEmailVerificationCodeSchema)

    const passed = await this.userRepository.confirmEmailVerificationCode(
      user,
      payload.code,
    )

    if (passed) {
      await this.userRepository.users().update(user.id, {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailVerificationCodeExpiresAt: null,
      })
    }

    if (!passed) {
      throw E_VALIDATION_FAILED([
        {
          message:
            'The verification code you provided was incorrect. Please check your email and try again.',
          field: 'code',
        },
      ])
    }

    return this.response(ctx).redirect(route('auth_register_password')).send()
  }

  /**
   * Sets the user's password.
   *
   * Validates and stores the user's password, ensuring it meets
   * security requirements. Once the password is set, the user
   * is redirected to complete their profile setup.
   */
  async password(ctx: HonoContext) {
    const user = ctx.get('user')

    if (user.password) {
      throw E_VALIDATION_FAILED([
        {
          message: 'You have already set a password. Please login instead.',
          field: 'password',
        },
      ])
    }

    const payload = await this.validate(ctx, SetUserPasswordSchema)

    await this.userRepository.update(user.id, payload)

    return this.response(ctx).redirect(route('auth_register_profile')).send()
  }
}
