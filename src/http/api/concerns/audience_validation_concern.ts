import { TeamPolicy } from '@/domains/audiences/policies/team_policy.js'
import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import { audiences } from '@/infrastructure/database/schema/schema.js'
import type { Audience } from '@/infrastructure/database/schema/types.js'
import type { HonoContext } from '@/infrastructure/server/types.js'
import { container } from '@/utils/typi.js'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

export class AudienceValidationAndAuthorizationConcern {
  constructor(
    private audienceRepository: AudienceRepository = container.make(
      AudienceRepository,
    ),
    private teamPolicy: TeamPolicy = container.make(TeamPolicy),
  ) {}

  public async ensureAudienceExists(ctx: HonoContext) {
    const audience = await this.audienceRepository.findById(
      ctx.req.param('audienceId'),
    )

    if (!audience) {
      throw E_VALIDATION_FAILED([
        { message: 'Unknown audience.', field: 'audienceId' },
      ])
    }

    return audience
  }

  public async ensureHasPermissions(ctx: HonoContext, audience: Audience) {
    const team = ctx.get('team')

    if (audience.teamId !== team.id) {
      throw E_UNAUTHORIZED('This audience does not belong to your team.')
    }

    if (!this.teamPolicy.canAdministrate(team, ctx.get('accessToken').userId)) {
      throw E_UNAUTHORIZED('You do not have permission to perform this action.')
    }

    return true
  }
}
