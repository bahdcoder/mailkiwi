import { eq } from "drizzle-orm"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy.ts"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.ts"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.ts"
import { mailers } from "@/infrastructure/database/schema/schema.ts"
import { Mailer } from "@/infrastructure/database/schema/types.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"
import { container } from "@/utils/typi.ts"

export class MailerValidationAndAuthorizationConcern {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
    private teamPolicy: TeamPolicy = container.make(TeamPolicy),
  ) {}

  public async ensureMailerExists(ctx: HonoContext) {
    const mailer = await this.mailerRepository.findById(
      ctx.req.param("mailerId"),
      [
        eq(mailers.teamId, ctx.get("team").id),
        eq(mailers.id, ctx.req.param("mailerId")),
      ],
    )

    if (!mailer)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown mailer.", path: ["mailerId"] }],
      })

    return mailer as Mailer
  }

  public async ensureHasPermissions(ctx: HonoContext) {
    if (
      !this.teamPolicy.canAdministrate(
        ctx.get("team"),
        ctx.get("accessToken").userId!,
      )
    )
      throw E_UNAUTHORIZED()
  }
}
