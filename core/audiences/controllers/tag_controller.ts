import { CreateTagAction } from '@/audiences/actions/tags/create_tag_action.js'
import { DeleteTagAction } from '@/audiences/actions/tags/delete_tag_action.js'
import { CreateTagSchema } from '@/audiences/dto/tags/create_tag_dto.js'

import type { Audience, Tag } from '@/database/database_schema_types.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoInstance } from '@/shared/server/hono.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

/**
 * TagController manages contact tagging functionality.
 *
 * This controller is responsible for:
 * 1. Creating new tags for contact categorization
 * 2. Deleting tags when they're no longer needed
 * 3. Enforcing proper access control for tag operations
 *
 * Tags are a fundamental tool for contact segmentation in Kibamail,
 * allowing marketers to categorize contacts based on interests,
 * behaviors, or other attributes for targeted email campaigns.
 */
export class TagController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/', this.create.bind(this)],
        ['DELETE', '/:tagId', this.delete.bind(this)],
      ],
      {
        prefix: 'audiences/:audienceId/tags',
      },
    )
  }

  /**
   * Creates a new tag in an audience.
   *
   * Validates the tag data and creates a new tag that can be used
   * to categorize contacts within the specified audience.
   */
  async create(ctx: HonoContext) {
    await this.ensureExists<Audience>(ctx, 'audienceId')

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateTagSchema)
    const audienceId = ctx.req.param('audienceId')

    const action = container.resolve<CreateTagAction>(CreateTagAction)

    const tag = await action.handle(data, audienceId)

    return ctx.json({ id: tag.id }, 201)
  }

  /**
   * Deletes a tag from an audience.
   *
   * Removes a tag and detaches it from any contacts that were using it.
   * This operation cannot be undone, but tags can be recreated if needed.
   */
  async delete(ctx: HonoContext) {
    const [, tag] = await Promise.all([
      this.ensureExists<Audience>(ctx, 'audienceId'),
      this.ensureExists<Tag>(ctx, 'tagId'),
    ])

    this.ensureCanAuthor(ctx)

    await container.resolve(DeleteTagAction).handle(tag.id)

    return ctx.json({ id: tag.id }, 200)
  }
}
