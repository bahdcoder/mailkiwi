import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import type { HonoContext } from "@/server/types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.ts"

import { container } from "@/utils/typi.js"

export class UserController extends BaseController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()
    this.app.defineRoutes([["GET", "/profile", this.profile.bind(this)]], {
      prefix: "auth",
    })
  }

  async profile(ctx: HonoContext) {
    const user = await this.userRepository.findById(this.user(ctx).id)

    return ctx.json(user)
  }
}
