import type { Next } from 'hono'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'

import { E_UNAUTHORIZED } from '#root/core/http/responses/errors.js'

import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

export class AuthorizeInjectorApiKeyMiddleware {
  constructor(private teamRepository = container.make(TeamRepository)) {}

  async verifySmtpCredentials(smtpUsername?: string, smtpPassword?: string) {
    if (!smtpPassword || !smtpUsername) {
      throw E_UNAUTHORIZED()
    }

    if (smtpPassword !== smtpUsername) {
      throw E_UNAUTHORIZED()
    }

    const credentialsAreValid = await container
      .make(AccessTokenRepository)
      .check(smtpPassword)

    if (!credentialsAreValid) throw E_UNAUTHORIZED()

    return credentialsAreValid
  }

  handle = async (ctx: HonoContext, next: Next) => {
    const authorization = ctx.req.header('Authorization')

    const [, apiKey] = authorization?.split('Bearer ') ?? []

    const accessToken = await this.verifySmtpCredentials(apiKey, apiKey)

    ctx.set('accessToken', accessToken)

    const teamWithSendingDomains = await this.teamRepository.findByIdWithDomains(
      accessToken.teamId as string,
    )

    ctx.set('teamWithSendingDomains', teamWithSendingDomains)

    await next()
  }
}
