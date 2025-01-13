import { and, eq } from "drizzle-orm"

import { CreateAudienceAction } from "@/audiences/actions/audiences/create_audience_action.js"
import { UpdateAudienceAction } from "@/audiences/actions/audiences/update_audience_action.js"
import { CreateAudienceSchema } from "@/audiences/dto/audiences/create_audience_dto.js"
import { UpdateAudienceSchema } from "@/audiences/dto/audiences/update_audience_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { Audience } from "@/database/database_schema_types.js"
import { audiences } from "@/database/schema.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoContext } from "@/shared/server/types.js"
import { Paginator } from "@/shared/utils/pagination/paginator.js"

import { container } from "@/utils/typi.js"

export class AudienceController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
        ["PUT", "/:audienceId", this.update.bind(this)],
      ],
      {
        prefix: "audiences",
      },
    )
  }

  async index(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const data = await new Paginator(audiences)
      .queryConditions([and(eq(audiences.teamId, team.id))])
      .cursor(undefined)
      .field(audiences.id)
      .next()

    return this.response(ctx).json(data).send()
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureCanManage(ctx)

    const audience = await container.make(CreateAudienceAction).handle(data, team.id)

    return this.response(ctx).json(audience).send()
  }

  async update(ctx: HonoContext) {
    this.ensureCanManage(ctx)

    const audience = await this.ensureExists<Audience>(ctx, "audienceId")
    const data = await this.validate(ctx, UpdateAudienceSchema)

    await container.make(UpdateAudienceAction).handle(data, audience.id)

    const updatedAudience = await container
      .make(AudienceRepository)
      .getAudienceForTeam(audience.teamId)

    return this.response(ctx).json(updatedAudience).send()
  }
}
