import { Secret } from "@poppinss/utils"
import { Next } from "hono"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository.js"
import { E_UNAUTHORIZED } from "@/http/responses/errors.js"
import { HonoContext } from "@/infrastructure/server/types.js"
import { container } from "@/utils/typi.js"

export class AccessTokenMiddleware {
  constructor(
    private accessTokenRepository: AccessTokenRepository = container.make(
      AccessTokenRepository,
    ),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const tokenHeader = ctx.req.header("authorization")?.split("Bearer ")?.[1]

    if (!tokenHeader) {
      throw E_UNAUTHORIZED()
    }

    const accessToken = await this.accessTokenRepository.verifyToken(
      new Secret(tokenHeader),
    )

    if (!accessToken) {
      throw E_UNAUTHORIZED()
    }

    ctx.set("accessToken", accessToken.accessToken)

    await next()
  }
}
