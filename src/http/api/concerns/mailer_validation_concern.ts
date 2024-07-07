import { eq } from "drizzle-orm"
import { FastifyRequest } from "fastify"
import { inject, injectable } from "tsyringe"

import { TeamPolicy } from "@/domains/audiences/policies/team_policy.ts"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.ts"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors.ts"
import { mailers } from "@/infrastructure/database/schema/schema.ts"
import { Mailer } from "@/infrastructure/database/schema/types.ts"

@injectable()
export class MailerValidationAndAuthorizationConcern {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
    @inject(TeamPolicy)
    private teamPolicy: TeamPolicy,
  ) {}

  public async ensureMailerExists(
    request: FastifyRequest<{ Params: { mailerId: string } }>,
  ) {
    const mailer = await this.mailerRepository.findById(
      request.params.mailerId,
      [
        eq(mailers.teamId, request.team.id),
        eq(mailers.id, request.params.mailerId),
      ],
    )

    if (!mailer)
      throw E_VALIDATION_FAILED({
        errors: [{ message: "Unknown mailer.", path: ["mailerId"] }],
      })

    return mailer as Mailer
  }

  public async ensureHasPermissions(request: FastifyRequest) {
    if (
      !this.teamPolicy.canAdministrate(
        request.team,
        request.accessToken.userId!,
      )
    )
      throw E_UNAUTHORIZED()
  }
}
