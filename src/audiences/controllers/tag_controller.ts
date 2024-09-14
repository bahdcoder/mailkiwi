import { CreateTagAction } from "@/audiences/actions/tags/create_tag_action.js"
import { DeleteTagAction } from "@/audiences/actions/tags/delete_tag_action.js"
import { AudienceValidationAndAuthorizationConcern } from "@/audiences/concerns/audience_validation_concern.ts"
import { CreateTagSchema } from "@/audiences/dto/tags/create_tag_dto.js"

import type { HonoInstance } from "@/server/hono.js"
import type { HonoContext } from "@/server/types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

import { container } from "@/utils/typi.js"

export class TagController extends BaseController {
  constructor(
    private app: HonoInstance = makeApp(),
    private audienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["DELETE", "/:tagId", this.delete.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/tags",
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
    const audienceId = parseInt(ctx.req.param("audienceId"))

    const action = container.resolve<CreateTagAction>(CreateTagAction)

    const tag = await action.handle(data, audienceId)

    return ctx.json({ id: tag.id }, 201)
  }

  async delete(ctx: HonoContext) {
    const tagId = parseInt(ctx.req.param("tagId"))

    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )

    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    await container.resolve(DeleteTagAction).handle(tagId)

    return ctx.json({ id: tagId }, 200)
  }
}
