import { appEnv } from "@/app/env/app_env.js"
import type { Next } from "hono"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { UserWithTeams } from "@/database/database_schema_types.js"

import type { HonoContext } from "@/shared/server/types.js"
import { Session } from "@/shared/sessions/sessions.js"

import { container } from "@/utils/typi.js"

export class UserSessionMiddleware {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamRepository = container.make(TeamRepository),
    private contactRepository = container.make(ContactRepository),
  ) {}

  handle = async (ctx: HonoContext, next: Next) => {
    const [userSession, contactSession] = await Promise.all([
      new Session().getUser(ctx),
      new Session().getUser(ctx, "contact"),
    ])

    let authenticatedUser: UserWithTeams | null = null

    if (userSession) {
      const user = await this.userRepository.findById(userSession.userId)

      authenticatedUser = user

      if (user) {
        ctx.set("user", user)
      }
    }

    if (contactSession) {
      const contact = await this.contactRepository.findById(contactSession.userId)

      if (contact) {
        ctx.set("contact", contact)
      }
    }

    if (!authenticatedUser) {
      return next()
    }

    let teamHeader =
      userSession?.currentTeamId ??
      ctx.req.header(appEnv.software.teamHeader) ??
      authenticatedUser?.teams?.[0]?.id

    if (teamHeader && teamHeader !== "undefined") {
      const team = await this.teamRepository.findById(teamHeader)

      if (team) {
        ctx.set("team", team)
      }
    }

    return next()
  }
}
