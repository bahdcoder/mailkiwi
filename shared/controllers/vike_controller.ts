import { ContainerKey } from '../container/index.js'
import type { VikePageRenderer } from '../types/vike.js'
import { createReadableStreamFromReadable } from '@remix-run/node'
import { and, eq } from 'drizzle-orm'
import type { Handler, MiddlewareHandler, Next } from 'hono'
import { PassThrough } from 'node:stream'
import { UAParser } from 'ua-parser-js'
import { renderPage } from 'vike/server'

import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { TagRepository } from '@/audiences/repositories/tag_repository.js'

import { TeamRepository } from '@/teams/repositories/team_repository.js'

import { SendingDomainRepository } from '@/sending_domains/repositories/sending_domain_repository.js'

import {
  sendingDomains as sendingDomainsTable,
  tags as tagsTable,
} from '@/database/schema.js'

import { BaseController } from '@/shared/controllers/base_controller.js'
import { PagePropsResolver } from '@/shared/controllers/page_props/page_props_resolver.js'
import { route } from '@/shared/routes/route_aliases.js'
import type { HonoContext, HonoRouteDefinition } from '@/shared/server/types.js'
import { excludeKeys } from '@/shared/utils/helpers/exclude_keys.js'

import { container } from '@/utils/typi.js'

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

  renderVikePage = async (
    ctx: HonoContext,
    next: Next,
    pageProps?: Record<string, any>,
  ) => {
    const pageContext = await renderPage({
      pageProps: await container.make(PagePropsResolver).handle(ctx, pageProps as any),
      ...pageProps,
      urlOriginal: ctx.req.url,
      headersOriginal: ctx.req.raw.headers,
    })

    if (!pageContext.httpResponse) return next()

    const responseHeaders = new Headers()

    const { statusCode, headers, pipe } = pageContext.httpResponse

    headers.forEach(([name, value]) => {
      responseHeaders.set(name, value)
    })

    // Pass headers from hono ctx through to new response, excluding the content type header.
    const honoHeaders = ctx.newResponse('').headers.entries() as unknown as [
      string,
      string,
    ][]

    honoHeaders.forEach(([name, value]) => {
      if (name !== 'content-type') {
        responseHeaders.set(name, value)
      }
    })

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

  page = async (ctx: HonoContext, next: Next, pageProps?: Record<string, any>) => {
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
      team: excludeKeys(ctx.get('team'), ['commerceProviderAccountId']),
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
