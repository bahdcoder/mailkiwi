import { container, inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy.js"
import { TeamRepository } from "@/domains/teams/repositories/team_repository.js"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class TeamController {
  constructor(
    @inject(TeamRepository) private teamRepository: TeamRepository,
    @inject(ContainerKey.app) private app: HonoInstance,
  ) {
    this.app.defineRoutes([["GET", "/:teamId", this.show.bind(this)]], {
      prefix: "teams",
    })
  }

  async show(ctx: HonoContext) {
    const teamId = ctx.req.param("teamId")

    const team = await this.teamRepository.findById(teamId)

    if (!team)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown team ID provided.", path: ["teamId"] }],
      })

    const policy = container.resolve<TeamPolicy>(TeamPolicy)

    if (!policy.canView(ctx.get("team"), ctx.get("accessToken").userId!))
      throw E_UNAUTHORIZED()

    return ctx.json(team)
  }
}
