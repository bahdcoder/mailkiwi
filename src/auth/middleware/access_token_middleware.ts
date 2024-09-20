import type { Next } from "hono"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import type { HonoContext } from "@/shared/server/types.js"
import {
  accessKeyHeaderName,
  accessSecretHeaderName,
} from "@/shared/utils/auth/get_auth_headers.js"

import { container } from "@/utils/typi.js"

export class AccessTokenMiddleware {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private userRepository = container.make(UserRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const accessKey = ctx.req.header(accessKeyHeaderName())
    const accessSecret = ctx.req.header(accessSecretHeaderName())

    if (!accessKey || !accessSecret) {
      throw E_UNAUTHORIZED()
    }

    const accessToken = await this.accessTokenRepository.check(
      accessKey,
      accessSecret,
    )

    if (!accessToken) {
      throw E_UNAUTHORIZED()
    }

    const user = await this.userRepository.findById(
      accessToken.userId as number,
    )

    if (!user) {
      throw E_UNAUTHORIZED()
    }

    ctx.set("accessToken", accessToken)
    ctx.set("user", user)

    await next()
  }
}
