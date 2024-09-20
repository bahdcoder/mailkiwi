import {
  type BaseSchema,
  type BaseSchemaAsync,
  type InferInput,
  safeParseAsync,
} from "valibot"

import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { TeamPolicy } from "@/audiences/policies/team_policy.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"
import { TagRepository } from "@/audiences/repositories/tag_repository.js"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"

import {
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from "@/http/responses/errors.js"

import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

type ControllerParams =
  | "importId"
  | "audienceId"
  | "contactId"
  | "tagId"
  | "broadcastId"
  | "membershipId"
export class BaseController {
  protected getParameter(ctx: HonoContext, param: ControllerParams) {
    const id = parseInt(ctx.req.param(param))

    if (isNaN(id) || !id) {
      throw E_VALIDATION_FAILED([
        {
          message: `Invalid ${param} provided.`,
          field: param,
        },
      ])
    }

    return id
  }

  protected async validate<
    T extends BaseSchema<any, any, any> | BaseSchemaAsync<any, any, any>,
  >(ctx: HonoContext, schema: T): Promise<InferInput<T>> {
    const payload = await ctx.req.json()

    const { success, issues, output } = await safeParseAsync(schema, {
      ...payload,
    })

    if (!success) throw E_VALIDATION_FAILED(issues)

    return output
  }

  protected ensureBelongsToTeam(
    ctx: HonoContext,
    entity: { teamId: number },
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

  protected ensureCanAuthor(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canManage = teamPolicy.canAuthor(team, this.user(ctx)?.id)

    if (!canManage) {
      throw E_UNAUTHORIZED(
        "You are not authorised to perform this action on this team.",
      )
    }

    return team
  }

  protected ensureCanView(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canView = teamPolicy.canView(team, this.user(ctx)?.id)

    if (!canView) {
      throw E_UNAUTHORIZED(
        "You are not authorised to perform this action on this team.",
      )
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
    authorizedUserIds: number[],
  ) {
    const userId = ctx.get("user")?.id

    if (!authorizedUserIds.includes(userId)) {
      throw E_UNAUTHORIZED(
        "You are not authorized to perform this action.",
      )
    }
  }

  protected async ensureExists<T>(
    ctx: HonoContext,
    param: ControllerParams,
  ) {
    const repositories = {
      contactId: ContactRepository,
      audienceId: AudienceRepository,
      importId: ContactImportRepository,
      tagId: TagRepository,
      broadcastId: BroadcastRepository,
      membershipId: TeamMembershipRepository,
    } as const

    const repository = container.make(repositories[param] as any) as any

    const entity = await repository.findById(this.getParameter(ctx, param))

    if (entity?.teamId) {
      const team = this.ensureTeam(ctx)

      if (team.id !== entity.teamId) {
        throw E_UNAUTHORIZED(
          `You are not authorized to perform this action on team ${team.id} and ${param} ${entity.id}`,
        )
      }
    }

    if (!entity) {
      throw E_VALIDATION_FAILED([
        {
          message: `Invalid ${param} provided.`,
          field: param,
        },
      ])
    }

    return entity as T
  }
}
