import { and, eq } from 'drizzle-orm'

import { CreateAudienceAction } from '#root/core/audiences/actions/audiences/create_audience_action.js'
import { UpdateAudienceAction } from '#root/core/audiences/actions/audiences/update_audience_action.js'
import { CreateAudienceSchema } from '#root/core/audiences/dto/audiences/create_audience_dto.js'
import { UpdateAudienceSchema } from '#root/core/audiences/dto/audiences/update_audience_dto.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'

import type { Audience } from '#root/database/database_schema_types.js'
import { audiences } from '#root/database/schema.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { Paginator } from '#root/core/shared/utils/pagination/paginator.js'

import { container } from '#root/core/utils/typi.js'

/**
 * AudienceController manages audience resources for email marketing.
 *
 * This controller is responsible for:
 * 1. Creating and managing audience segments for targeted marketing
 * 2. Providing endpoints to list, create, and update audiences
 * 3. Enforcing team-based access control for audience resources
 *
 * Audiences are a fundamental organizational unit in Kibamail, representing
 * groups of contacts that can be targeted for email campaigns. Each audience
 * belongs to a specific team and can contain multiple segments and contacts.
 */
export class AudienceController extends BaseController {
  constructor(private app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ['GET', '/', this.index.bind(this)],
        ['POST', '/', this.store.bind(this)],
        ['PUT', '/:audienceId', this.update.bind(this)],
      ],
      {
        prefix: 'audiences',
      },
    )
  }

  /**
   * Lists all audiences for the current team.
   *
   * Returns a paginated list of audiences that belong to the authenticated user's team.
   */
  async index(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const data = await new Paginator(audiences)
      .queryConditions([and(eq(audiences.teamId, team.id))])
      .cursor(undefined)
      .field(audiences.id)
      .next()

    return this.response(ctx).json(data).send()
  }

  /**
   * Creates a new audience for the team.
   *
   * Validates the request data and creates an audience resource that will be
   * available for contacts and email campaigns.
   */
  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateAudienceSchema)

    const team = this.ensureCanManage(ctx)

    const audience = await container.make(CreateAudienceAction).handle(data, team.id)

    return this.response(ctx).json(audience).send()
  }

  /**
   * Updates an existing audience.
   *
   * Validates the request data and updates the specified audience if the
   * authenticated user has permission to manage it.
   */
  async update(ctx: HonoContext) {
    this.ensureCanManage(ctx)

    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')
    const data = await this.validate(ctx, UpdateAudienceSchema)

    await container.make(UpdateAudienceAction).handle(data, audience.id)

    const updatedAudience = await container
      .make(AudienceRepository)
      .getAudienceForTeam(audience.teamId)

    return this.response(ctx).json(updatedAudience).send()
  }
}
