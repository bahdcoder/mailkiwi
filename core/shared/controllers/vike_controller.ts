import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@remix-run/node'
import { and, eq } from 'drizzle-orm'
import type { Handler, MiddlewareHandler, Next } from 'hono'
import { UAParser } from 'ua-parser-js'
import { renderPage } from 'vike/server'
import { ContainerKey } from '../container/index.js'
import type { VikePageRenderer } from '../types/vike.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { TagRepository } from '#root/core/audiences/repositories/tag_repository.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import {
  sendingDomains as sendingDomainsTable,
  tags as tagsTable,
} from '#root/database/schema.js'

import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { PagePropsResolver } from '#root/core/shared/controllers/page_props/page_props_resolver.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext, HonoRouteDefinition } from '#root/core/shared/server/types.js'
import { excludeKeys } from '#root/core/shared/utils/helpers/exclude_keys.js'

import { TeamCreditRepository } from '#root/core/teams/repositories/team_credit_repository.js'
import { container } from '#root/core/utils/typi.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { DEFAULT_TEAM_NAME } from '#root/database/constants.js'

export class VikeController extends BaseController {
  vikePath = (
    path: string,
    handler: Handler,
    middleware?: MiddlewareHandler[],
  ): HonoRouteDefinition[] => {
    return [
      ['GET', path, handler, middleware],
      [
        'GET',
        `${path}${path.endsWith('/') ? '' : '/'}index.pageContext.json`,
        handler,
        middleware,
      ],
    ]
  }

  renderVikePage = async (ctx: HonoContext, next: Next, pageProps?: unknown) => {
    const props = pageProps as DefaultPageProps

    const resolvedPageProps = await container.make(PagePropsResolver).handle(ctx, props)

    const pageContext = await renderPage({
      ...props,
      pageProps: resolvedPageProps,
      urlOriginal: ctx.req.url,
      headersOriginal: ctx.req.raw.headers,
    })

    if (!pageContext.httpResponse) return next()

    const responseHeaders = new Headers()

    const { statusCode, headers, pipe } = pageContext.httpResponse

    for (const [name, value] of headers) {
      responseHeaders.set(name, value)
    }

    // Pass headers from hono ctx through to new response, excluding the content type header.
    const honoHeaders = ctx.newResponse('').headers.entries() as unknown as [
      string,
      string,
    ][]

    for (const [name, value] of honoHeaders) {
      if (name !== 'content-type') {
        responseHeaders.set(name, value)
      }
    }

    return new Promise((resolve, reject) => {
      const body = new PassThrough()

      const stream = createReadableStreamFromReadable(body)

      pipe(body)

      return resolve(
        new Response(stream, {
          status: statusCode,
          headers: responseHeaders,
        }),
      )
    })
  }

  redirectToWelcomeIfAuthenticatedPage = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get('user')

    if (
      (user && !user.teams?.[0]?.name) ||
      (user && user.teams?.[0]?.name === DEFAULT_TEAM_NAME)
    ) {
      return this.response(ctx).redirect(route('auth_register_profile')).send()
    }

    if (user) {
      return this.response(ctx).redirect(route('welcome')).send()
    }

    return this.page(ctx, next)
  }

  redirectToLoginIfNotAuthenticatedPage = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get('user')

    if (!user) {
      return this.response(ctx).redirect(route('auth_login')).send()
    }

    return this.page(ctx, next)
  }

  page = async (ctx: HonoContext, next: Next, pageProps?: Record<string, unknown>) => {
    const renderVikePage = container.make<VikePageRenderer>(ContainerKey.vikeRenderPage)

    const userAgentHeader = ctx.req.header('user-agent')

    const userAgent = userAgentHeader ? new UAParser(userAgentHeader) : undefined

    const teamId = ctx.get('team')?.id

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
      ? await container.make(TeamCreditRepository).totalAvailableCredits(teamId)
      : 0

    const totalConsumedCredits = teamId
      ? await teamCreditRepository.totalConsumedCredits(teamId)
      : 0

    return renderVikePage(ctx, next, {
      ...pageProps,
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
    })
  }
}
