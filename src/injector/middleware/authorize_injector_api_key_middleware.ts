import type { Next } from "hono"

import { E_UNAUTHORIZED } from "@/http/responses/errors.ts"

import { makeRedis } from "@/shared/container/index.ts"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.ts"
import type { HonoContext } from "@/shared/server/types.js"
import {
  accessKeyHeaderName,
  accessSecretHeaderName,
} from "@/shared/utils/auth/get_auth_headers.ts"

import { REDIS_KNOWN_KEYS } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.ts"

export class AuthorizeInjectorApiKeyMiddleware {
  constructor(private redis = makeRedis()) {}

  async verifySmtpCredentials(
    smtpUsername?: string,
    smtpPassword?: string,
  ) {
    if (!smtpPassword || !smtpUsername) {
      throw E_UNAUTHORIZED()
    }

    const hashedAccessSecret = await this.redis.get(
      REDIS_KNOWN_KEYS.ACCESS_KEY(smtpUsername),
    )

    if (!hashedAccessSecret) throw E_UNAUTHORIZED()

    const credentialsAreValid = await container
      .make(ScryptTokenRepository)
      .verify(smtpPassword, hashedAccessSecret)

    if (!credentialsAreValid) throw E_UNAUTHORIZED()
  }

  handle = async (ctx: HonoContext, next: Next) => {
    const smtpUsername = ctx.req.header(accessKeyHeaderName())
    const smtpPassword = ctx.req.header(accessSecretHeaderName())

    await this.verifySmtpCredentials(smtpUsername, smtpPassword)

    await next()
  }
}
