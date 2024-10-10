import type { Next } from "hono"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import { makeRedis } from "@/shared/container/index.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"
import type { HonoContext } from "@/shared/server/types.js"

import { REDIS_KNOWN_KEYS } from "@/redis/redis_client.js"

import { container } from "@/utils/typi.js"

export class AuthorizeSendingDomainMiddleware {
  constructor(private teamRepository = container.make(TeamRepository)) {}
  handle = async (ctx: HonoContext, next: Next) => {
    const accessToken = ctx.get("accessToken")

    const teamWithDomains = await this.teamRepository.findByIdWithDomains(
      accessToken.teamId as string,
    )

    d(teamWithDomains)

    await next()
  }
}
