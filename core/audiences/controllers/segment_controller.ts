import { CreateSegmentSchema } from '#root/core/audiences/dto/segments/create_segment_dto.js'
import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * SegmentController manages audience segmentation functionality.
 *
 * This controller is responsible for:
 * 1. Creating dynamic segments based on contact properties and behaviors
 * 2. Managing segment definitions for targeted email campaigns
 * 3. Enforcing proper access control for segment operations
 *
 * Segments are a powerful targeting tool in Kibamail, allowing marketers
 * to define specific subsets of their audience based on properties,
 * behaviors, or engagement history for more personalized email campaigns.
 */
export class SegmentController extends BaseController {
  constructor(
    private app = makeApp(),
    private segmentRepository = container.make(SegmentRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/', this.create.bind(this)],
        ['DELETE', '/:segmentId', this.delete.bind(this)],
      ],
      {
        prefix: 'audiences/:audienceId/segments',
      },
    )
  }

  /**
   * Creates a new segment in an audience.
   *
   * Validates the segment definition and creates a new segment
   * that can be used to target specific contacts within the audience
   * based on their properties or behaviors.
   */
  async create(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateSegmentSchema)

    const segment = await this.segmentRepository.create({
      ...data,
      audienceId: audience.id,
    })

    return ctx.json(segment)
  }

  /**
   * Deletes a segment from an audience.
   *
   * Removes a segment definition. This doesn't affect the contacts
   * themselves, only the ability to target them using this segment.
   */
  async delete(ctx: HonoContext) {
    await this.ensureExists<Audience>(ctx, 'audienceId')

    this.ensureCanAuthor(ctx)

    const segmentId = ctx.req.param('segmentId')

    await this.segmentRepository.delete(segmentId)

    return ctx.json({ id: segmentId })
  }
}
