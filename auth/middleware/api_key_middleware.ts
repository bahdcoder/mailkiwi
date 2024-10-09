import type { Next } from "hono"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class ApiKeyMiddleware {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const authorization = ctx.req.header("Authorization")

    const [apiKey] = authorization?.split("Bearer ") ?? []

    if (!apiKey) {
      return next()
    }

    const accessToken = await this.accessTokenRepository.check(apiKey)

    if (!accessToken) {
      return next()
    }

    ctx.set("accessToken", accessToken)

    await next()
  }
}
