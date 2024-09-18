import { CreateSegmentSchema } from "@/audiences/dto/segments/create_segment_dto.js"
import { SegmentRepository } from "@/audiences/repositories/segment_repository.ts"

import { Audience } from "@/database/schema/database_schema_types.ts"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.ts"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.ts"

export class SegmentController extends BaseController {
  constructor(
    private app = makeApp(),
    private segmentRepository = container.make(SegmentRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["DELETE", "/:segmentId", this.delete.bind(this)],
      ],
      {
        prefix: "audiences/:audienceId/segments",
      },
    )
  }

  async create(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateSegmentSchema)

    const segment = await this.segmentRepository.create({
      ...data,
      audienceId: audience.id,
    })

    return ctx.json(segment)
  }

  async delete(ctx: HonoContext) {
    await this.ensureExists<Audience>(ctx, "audienceId")

    this.ensureCanAuthor(ctx)

    const segmentId = parseInt(ctx.req.param("segmentId"))

    await this.segmentRepository.delete(segmentId)

    return ctx.json({ id: segmentId })
  }
}
