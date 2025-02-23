import { CreateBroadcastGroupSchema } from '@/broadcasts/dto/create_broadcast_group_schema_dto.js'
import { BroadcastGroupRepository } from '@/broadcasts/repositories/broadcast_group_repository.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import { route } from '@/shared/routes/route_aliases.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

export class BroadcastGroupController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    app.defineRoutes([['POST', route('create_broadcast_group'), this.store]])
  }

  store = async (ctx: HonoContext) => {
    const data = await this.validate(ctx, CreateBroadcastGroupSchema)

    const team = this.ensureCanManage(ctx)

    const broadcastGroup = await container
      .make(BroadcastGroupRepository)
      .groups()
      .create({ ...data, teamId: team.id })

    return this.response(ctx).json(broadcastGroup).send()
  }
}
