import type { Next } from "hono"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class AccessTokenMiddleware {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private userRepository = container.make(UserRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const authorization = ctx.req.header("Authorization")

    const [apiKey] = authorization?.split("Bearer ") ?? []

    if (!apiKey) {
      throw E_UNAUTHORIZED()
    }

    const accessToken = await this.accessTokenRepository.check(apiKey)

    if (!accessToken) {
      throw E_UNAUTHORIZED()
    }

    const user = await this.userRepository.findById(
      accessToken.userId as string,
    )

    if (!user) {
      throw E_UNAUTHORIZED()
    }

    ctx.set("accessToken", accessToken)
    ctx.set("user", user)

    await next()
  }
}
