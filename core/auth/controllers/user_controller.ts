import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

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
    this.app.defineRoutes([['GET', '/profile', this.profile.bind(this)]], {
      prefix: 'auth',
    })
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
}
