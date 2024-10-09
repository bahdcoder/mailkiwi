import type { Next } from "hono"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import { makeRedis } from "@/shared/container/index.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"
import type { HonoContext } from "@/shared/server/types.js"

import { REDIS_KNOWN_KEYS } from "@/redis/redis_client.js"

import { container } from "@/utils/typi.js"

export class AuthorizeInjectorApiKeyMiddleware {
  constructor(private redis = makeRedis()) {}

  async verifySmtpCredentials(
    smtpUsername?: string,
    smtpPassword?: string,
  ) {
    if (!smtpPassword || !smtpUsername) {
      throw E_UNAUTHORIZED()
    }

    if (smtpPassword !== smtpUsername) {
      throw E_UNAUTHORIZED()
    }

    const credentialsAreValid = await container
      .make(AccessTokenRepository)
      .check(smtpPassword)

    if (!credentialsAreValid) throw E_UNAUTHORIZED()
  }

  handle = async (ctx: HonoContext, next: Next) => {
    // await this.verifySmtpCredentials(smtpUsername, smtpPassword)

    await next()
  }
}
