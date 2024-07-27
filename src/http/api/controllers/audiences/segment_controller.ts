import { AudienceValidationAndAuthorizationConcern } from '@/http/api/concerns/audience_validation_concern.js'
import { makeApp } from '@/infrastructure/container.ts'
import { BaseController } from '@/domains/shared/controllers/base_controller.ts'
import { container } from '@/utils/typi.ts'
import type { HonoContext } from '@/infrastructure/server/types.ts'
import { CreateSegmentSchema } from '@/domains/audiences/dto/segments/create_segment_dto.js'
import { SegmentRepository } from '@/domains/audiences/repositories/segment_repository.ts'

export class SegmentController extends BaseController {
  constructor(
    private app = makeApp(),
    private audienceValidationAndAuthorizationConcern: AudienceValidationAndAuthorizationConcern = container.make(
      AudienceValidationAndAuthorizationConcern,
    ),
    private segmentRepository: SegmentRepository = container.make(
      SegmentRepository,
    ),
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

  async create(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const data = await this.validate(ctx, CreateSegmentSchema)

    const segment = await this.segmentRepository.create({
      ...data,
      audienceId: audience.id,
    })

    return ctx.json(segment)
  }

  async delete(ctx: HonoContext) {
    const audience =
      await this.audienceValidationAndAuthorizationConcern.ensureAudienceExists(
        ctx,
      )
    await this.audienceValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
      audience,
    )

    const segmentId = ctx.req.param('segmentId')

    // const action = container.resolve(DeleteSegmentAction)

    // await action.handle(segmentId)

    // return ctx.json({ id: segmentId })
  }
}
