import { TeamPolicy } from "@/audiences/policies/team_policy.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class TeamController extends BaseController {
  constructor(
    private teamRepository: TeamRepository = container.make(
      TeamRepository,
    ),
    private app: HonoInstance = makeApp(),
  ) {
    super()
    this.app.defineRoutes([["GET", "/:teamId", this.show.bind(this)]], {
      prefix: "teams",
    })
  }

  async show(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: "Unknown team ID provided.",
          field: "teamId",
        },
      ])

    this.ensureCanView(ctx)

    return ctx.json(team)
  }
}
