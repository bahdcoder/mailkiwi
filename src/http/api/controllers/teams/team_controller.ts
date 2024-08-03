import { TeamPolicy } from "@/audiences/policies/team_policy.js";
import { TeamRepository } from "@/teams/repositories/team_repository.js";
import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js";
import { makeApp } from "@/shared/container/index.js";
import type { HonoInstance } from "@/server/hono.js";
import type { HonoContext } from "@/server/types.js";
import { container } from "@/utils/typi.js";

export class TeamController {
  constructor(
    private teamRepository: TeamRepository = container.make(TeamRepository),
    private app: HonoInstance = makeApp(),
  ) {
    this.app.defineRoutes([["GET", "/:teamId", this.show.bind(this)]], {
      prefix: "teams",
    });
  }

  async show(ctx: HonoContext) {
    const teamId = ctx.req.param("teamId");

    const team = await this.teamRepository.findById(teamId);

    if (!team)
      throw E_VALIDATION_FAILED([
        { message: "Unknown team ID provided.", field: "teamId" },
      ]);

    const policy = container.resolve<TeamPolicy>(TeamPolicy);

    if (!policy.canView(ctx.get("team"), ctx.get("accessToken").userId))
      throw E_UNAUTHORIZED();

    return ctx.json(team);
  }
}
