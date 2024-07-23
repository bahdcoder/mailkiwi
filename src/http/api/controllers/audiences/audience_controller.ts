import { CreateAudienceAction } from '@/domains/audiences/actions/audiences/create_audience_action.js'
import { UpdateAudienceAction } from '@/domains/audiences/actions/audiences/update_audience_action.js'
import { CreateAudienceSchema } from '@/domains/audiences/dto/audiences/create_audience_dto.js'
import { AudiencePolicy } from '@/domains/audiences/policies/audience_policy.js'
import { BaseController } from '@/domains/shared/controllers/base_controller.js'
import { E_UNAUTHORIZED } from '@/http/responses/errors.js'
import { makeApp } from '@/infrastructure/container.js'
import type { HonoContext } from '@/infrastructure/server/types.js'
import { container } from '@/utils/typi.js'

export class AudienceController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ['GET', '/', this.index.bind(this)],
        ['POST', '/', this.store.bind(this)],
      ],
      {
        prefix: 'audiences',
      },
    )
  }

  async index(ctx: HonoContext) {
    ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureTeam(ctx)

    const userId = ctx.get('accessToken')?.userId

    const policy = container.make(AudiencePolicy)

    if (!policy.canCreate(team, userId)) throw E_UNAUTHORIZED()

    const action = container.make(CreateAudienceAction)

    const audience = await action.handle(data, team.id)

    return ctx.json(audience)
  }

  async update(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureTeam(ctx)
    const accessToken = ctx.get('accessToken')

    const policy = container.resolve(AudiencePolicy)

    if (!policy.canCreate(team, accessToken.userId)) throw E_UNAUTHORIZED()

    const action = container.resolve(UpdateAudienceAction)

    const audience = await action.handle(data, team.id)

    return ctx.json(audience)
  }
}
