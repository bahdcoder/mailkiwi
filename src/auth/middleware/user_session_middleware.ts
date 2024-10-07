import { apiEnv } from "@/api/env/api_env.js"
import type { Next } from "hono"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import {
  E_OPERATION_FAILED,
  E_UNAUTHORIZED,
} from "@/http/responses/errors.js"

import { Session } from "@/shared/cookies/cookies.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class UserSessionMiddleware {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamRepository = container.make(TeamRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const userSession = await new Session().getUser(ctx)

    if (!userSession) {
      throw E_UNAUTHORIZED()
    }

    const user = await this.userRepository.findById(userSession.userId)

    if (!user) {
      throw E_UNAUTHORIZED()
    }

    ctx.set("user", user)

    let teamHeader =
      ctx.req.header(apiEnv.software.teamHeader) ?? user?.teams?.[0]?.id

    if (!teamHeader) {
      throw E_OPERATION_FAILED(`Invalid team selector provided.`)
    }

    const team = await this.teamRepository.findById(teamHeader)

    if (!team) {
      throw E_OPERATION_FAILED(`Invalid team selector provided.`)
    }

    ctx.set("team", team)

    await next()
  }
}
