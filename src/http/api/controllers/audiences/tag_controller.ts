import { CreateTagAction } from '@/domains/audiences/actions/tags/create_tag_action.js'
import { DeleteTagAction } from '@/domains/audiences/actions/tags/delete_tag_action.js'
import { CreateTagSchema } from '@/domains/audiences/dto/tags/create_tag_dto.js'
import { BaseController } from '@/domains/shared/controllers/base_controller.js'
import { AudienceValidationAndAuthorizationConcern } from '@/http/api/concerns/audience_validation_concern.js'
import { makeApp } from '@/infrastructure/container.js'
import type { HonoInstance } from '@/infrastructure/server/hono.js'
import type { HonoContext } from '@/infrastructure/server/types.js'
import { container } from '@/utils/typi.js'

export class TagController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),
    private audienceValidationAndAuthorizationConcern: AudienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
  ) {
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

  async create(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )

    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const data = await this.validate(ctx, CreateTagSchema)
    const audienceId = ctx.req.param('audienceId')

    const action = container.resolve<CreateTagAction>(CreateTagAction)

    const tag = await action.handle(data, audienceId)

    return ctx.json({ id: tag.id }, 201)
  }

  async delete(ctx: HonoContext) {
    const tagId = ctx.req.param('tagId')

    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )

    const hasPermissions =
      await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
        ctx,
        audience,
      )

    const action = container.resolve(DeleteTagAction)

    await action.handle(tagId)

    return ctx.json({ id: tagId }, 200)
  }
}
