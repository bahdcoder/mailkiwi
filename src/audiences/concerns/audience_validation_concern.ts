import { TeamPolicy } from '@/audiences/policies/team_policy.js'
import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import type { Audience } from '@/database/schema/database_schema_types.js'
import type { HonoContext } from '@/server/types.js'
import { container } from '@/utils/typi.js'

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
