import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { TeamPolicy } from "@/audiences/policies/team_policy.js"

import type { BroadcastWithoutContent } from "@/database/schema/database_schema_types.js"

import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"

import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class BroadcastValidationAndAuthorizationConcern {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
    private teamPolicy: TeamPolicy = container.make(TeamPolicy),
  ) {}

  public async ensureBroadcastExists(
    ctx: HonoContext,
    opts?: { loadAbTestVariants?: boolean },
  ) {
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

  public async ensureHasPermissions(
    ctx: HonoContext,
    broadcast?: BroadcastWithoutContent,
  ) {
    const team = ctx.get("team")
    const userId = ctx.get("accessToken").userId

    if (broadcast && broadcast.teamId !== team.id) {
      throw E_UNAUTHORIZED()
    }

    if (!this.teamPolicy.canAdministrate(team, userId)) {
      throw E_UNAUTHORIZED()
    }
  }
}
