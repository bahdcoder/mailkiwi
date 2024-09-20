import { CreateTagAction } from "@/audiences/actions/tags/create_tag_action.js"
import { DeleteTagAction } from "@/audiences/actions/tags/delete_tag_action.js"
import { CreateTagSchema } from "@/audiences/dto/tags/create_tag_dto.js"

import { Audience, Tag } from "@/database/schema/database_schema_types.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoInstance } from "@/shared/server/hono.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class TagController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
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
    await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateTagSchema)
    const audienceId = parseInt(ctx.req.param("audienceId"))

    const action = container.resolve<CreateTagAction>(CreateTagAction)

    const tag = await action.handle(data, audienceId)

    return ctx.json({ id: tag.id }, 201)
  }

  async delete(ctx: HonoContext) {
    const [, tag] = await Promise.all([
      this.ensureExists<Audience>(ctx, "audienceId"),
      this.ensureExists<Tag>(ctx, "tagId"),
    ])

    this.ensureCanAuthor(ctx)

    await container.resolve(DeleteTagAction).handle(tag.id)

    return ctx.json({ id: tag.id }, 200)
  }
}
