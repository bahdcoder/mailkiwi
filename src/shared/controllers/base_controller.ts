import {
  type BaseSchema,
  type BaseSchemaAsync,
  type InferInput,
  safeParseAsync,
} from "valibot"

import { TeamPolicy } from "@/audiences/policies/team_policy.ts"

import { Team } from "@/database/schema/database_schema_types.ts"

import type { HonoContext } from "@/server/types.js"

import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"

import { TeamWithMembers } from "@/shared/types/team.ts"

import { container } from "@/utils/typi.ts"

export class BaseController {
  private commonControllerParams = ["importId", "audienceId", "contactId"]

  protected async validate<
    T extends BaseSchema<any, any, any> | BaseSchemaAsync<any, any, any>,
  >(ctx: HonoContext, schema: T): Promise<InferInput<T>> {
    const payload = await ctx.req.json()

    const params: Record<string, string> = {}

    for (const param of this.commonControllerParams) {
      params[param] = ctx.req.param(param)
    }

    const { success, issues, output } = await safeParseAsync(schema, {
      ...payload,
      params,
    })

    if (!success) throw E_VALIDATION_FAILED(issues)

    return output
  }

  protected ensureBelongsToTeam(
    ctx: HonoContext,
    entity: { teamId: string },
  ) {
    const team = this.ensureTeam(ctx)

    if (team.id !== entity.teamId) {
      throw E_UNAUTHORIZED(
        `This entity does not belong to your selected team. `,
      )
    }
  }

  protected ensureTeam(ctx: HonoContext) {
    const team = ctx.get("team")

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: "The team is required.",
          field: "team",
        },
      ])

    return team
  }

  protected ensureCanAdministrate(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canAdministrate = teamPolicy.canAdministrate(
      team,
      this.user(ctx)?.id,
    )

    if (!canAdministrate) {
      throw E_UNAUTHORIZED(
        "You are not authorised to administrate this team.",
      )
    }

    return team
  }

  protected ensureCanManage(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canManage = teamPolicy.canManage(team, this.user(ctx)?.id)

    if (!canManage) {
      throw E_UNAUTHORIZED("You are not authorised to manage this team.")
    }

    return team
  }

  protected user(ctx: HonoContext) {
    return ctx.get("user")
  }

  protected team(ctx: HonoContext) {
    return ctx.get("team")
  }

  protected ensureAuthorized(
    ctx: HonoContext,
    authorizedUserIds: string[],
  ) {
    const userId = ctx.get("user")?.id

    if (!authorizedUserIds.includes(userId)) {
      throw E_UNAUTHORIZED(
        "You are not authorized to perform this action.",
      )
    }
  }
}
