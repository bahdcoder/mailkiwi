import { CreateAudienceAction } from "@/audiences/actions/audiences/create_audience_action.js"
import { UpdateAudienceAction } from "@/audiences/actions/audiences/update_audience_action.js"
import { CreateAudienceSchema } from "@/audiences/dto/audiences/create_audience_dto.js"
import { AudiencePolicy } from "@/audiences/policies/audience_policy.js"

import type { HonoContext } from "@/server/types.js"

import { E_UNAUTHORIZED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

import { container } from "@/utils/typi.js"

export class AudienceController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ["GET", "/", this.index.bind(this)],
        ["POST", "/", this.store.bind(this)],
      ],
      {
        prefix: "audiences",
      },
    )
  }

  async index(ctx: HonoContext) {
    ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureCanManage(ctx)

    const audience = await container
      .make(CreateAudienceAction)
      .handle(data, team.id)

    return ctx.json(audience)
  }

  async update(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureCanManage(ctx)

    const audience = container
      .resolve(UpdateAudienceAction)
      .handle(data, team.id)

    return ctx.json(audience)
  }
}
