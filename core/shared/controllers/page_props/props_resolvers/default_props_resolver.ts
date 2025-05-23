import { GetContactsAction } from '#root/core/audiences/actions/contacts/get_contacts_action.js'
import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'
import {
  segments as segmentsTable,
  sendingDomains as sendingDomainsTable,
  tags as tagsTable,
} from '#root/database/schema.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { container } from '#root/core/utils/typi.js'
import { eq } from 'drizzle-orm'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository'
import { TagRepository } from '#root/core/audiences/repositories/tag_repository'
import { TeamCreditRepository } from '#root/core/teams/repositories/team_credit_repository'
import { excludeKeys } from '#root/core/shared/utils/helpers/exclude_keys'
import { UAParser } from 'ua-parser-js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository'

export class DefaultPropsResolver {
  async resolve(ctx: HonoContext) {
    const teamId = ctx.get('team')?.id

    const userAgentHeader = ctx.req.header('user-agent')

    const userAgent = userAgentHeader ? new UAParser(userAgentHeader) : undefined

    const audience = teamId
      ? await container.make(AudienceRepository).getAudienceForTeam(teamId)
      : undefined

    const sendingDomains = teamId
      ? await container
          .make(SendingDomainRepository)
          .domains()
          .findAll(eq(sendingDomainsTable.teamId, teamId))
      : []

    const tags = audience?.id
      ? await container
          .make(TagRepository)
          .tags()
          .findAll(eq(tagsTable.audienceId, audience.id))
      : []

    const teamCreditRepository = container.make(TeamCreditRepository)

    const totalAvailableCredits = teamId
      ? await teamCreditRepository.totalAvailableCredits(teamId)
      : 0

    const totalConsumedCredits = teamId
      ? await teamCreditRepository.totalConsumedCredits(teamId)
      : 0

    return {
      user: excludeKeys(ctx.get('user'), [
        'emailVerificationCodeExpiresAt',
        'emailVerificationCode',
        'password',
      ]),
      flash: ctx.get('flash'),
      userAgent: userAgent
        ? {
            browser: userAgent.getBrowser(),
            os: userAgent.getOS(),
            device: userAgent.getDevice(),
          }
        : undefined,
      isMobile: userAgent?.getDevice().type === 'mobile',
      memberships: ctx.get('memberships'),
      team: {
        ...excludeKeys(ctx.get('team'), ['commerceProviderAccountId']),
        totalAvailableCredits,
        totalConsumedCredits,
      },
      sendingDomains: sendingDomains.map((domain) =>
        excludeKeys(domain, [
          'engageSecSendingSourceId',
          'engageSendingSourceId',
          'sendingSourceId',
          'secondarySendingSourceId',
          'dkimPrivateKey',
          'dkimPublicKey',
          'trackingSslCertSecret',
          'trackingSslCertKey',
        ]),
      ),
      audience,
      tags,
      engage: {
        onboarded: teamId
          ? await container.make(TeamRepository).completedOnboarding(teamId).engage()
          : false,
      },
      send: {
        onboarded: teamId
          ? await container.make(TeamRepository).completedOnboarding(teamId).send()
          : false,
      },
    }
  }
}
