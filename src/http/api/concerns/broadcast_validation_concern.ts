import { BroadcastRepository } from "@/domains/broadcasts/repositories/broadcast_repository.js"
import { TeamPolicy } from "@/domains/audiences/policies/team_policy.js"
import { HonoContext } from "@/infrastructure/server/types.js"
import { container } from "@/utils/typi.js"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { Broadcast } from "@/infrastructure/database/schema/types.ts"

export class BroadcastValidationAndAuthorizationConcern {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
    private teamPolicy: TeamPolicy = container.make(TeamPolicy),
  ) {}

  public async ensureBroadcastExists(ctx: HonoContext) {
    const broadcast = await this.broadcastRepository.findById(
      ctx.req.param("broadcastId"),
    )

    if (!broadcast) {
      throw E_VALIDATION_FAILED([
        { message: "Unknown broadcast.", field: "id" },
      ])
    }

    return broadcast
  }

  public async ensureHasPermissions(ctx: HonoContext, broadcast?: Broadcast) {
    const team = ctx.get("team")
    const userId = ctx.get("accessToken").userId!

    if (broadcast && broadcast.teamId !== team.id) {
      throw E_UNAUTHORIZED()
    }

    if (!this.teamPolicy.canAdministrate(team, userId)) {
      throw E_UNAUTHORIZED()
    }
  }
}
