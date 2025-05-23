import { CreateBroadcastGroupSchema } from '#root/core/broadcasts/dto/create_broadcast_group_schema_dto.js'
import { BroadcastGroupRepository } from '#root/core/broadcasts/repositories/broadcast_group_repository.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * BroadcastGroupController manages broadcast campaign grouping functionality.
 *
 * This controller is responsible for:
 * 1. Creating logical groups for organizing related broadcast campaigns
 * 2. Enabling better organization and management of email marketing campaigns
 *
 * Broadcast groups allow marketers to organize related campaigns together,
 * such as grouping all newsletters, promotional emails, or onboarding
 * sequences for better campaign management and reporting.
 */
export class BroadcastGroupController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    app.defineRoutes([['POST', route('create_broadcast_group'), this.store]])
  }

  /**
   * Creates a new broadcast group.
   *
   * Validates the group data and creates a new organizational group
   * for categorizing related broadcast campaigns.
   */
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
