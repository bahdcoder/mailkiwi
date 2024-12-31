import { ContainerKey } from "../container/index.js"
import { VikePageRenderer } from "../types/vike.js"
import { createReadableStreamFromReadable } from "@remix-run/node"
import { Handler, MiddlewareHandler, Next } from "hono"
import { PassThrough } from "stream"
import { UAParser } from "ua-parser-js"
import { renderPage } from "vike/server"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { BaseController } from "@/shared/controllers/base_controller.js"
import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext, HonoRouteDefinition } from "@/shared/server/types.js"
import { excludeKeys } from "@/shared/utils/helpers/exclude_keys.js"

import { container } from "@/utils/typi.js"

export class VikeController extends BaseController {
  vikePath = (
    path: string,
    handler: Handler,
    middleware?: MiddlewareHandler[],
  ): HonoRouteDefinition[] => {
    return [
      ["GET", path, handler, middleware],
      [
        "GET",
        `${path}${path.endsWith("/") ? "" : "/"}index.pageContext.json`,
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
      pageProps,
      user: pageProps?.user,
      team: pageProps?.team,
      flash: pageProps?.flash,
      memberships: pageProps?.memberships,
      userAgent: pageProps?.userAgent,
      urlOriginal: ctx.req.url,
      isMobile: pageProps?.isMobile,
      headersOriginal: ctx.req.raw.headers,
      letters: pageProps?.letters,
    })

    if (!pageContext.httpResponse) return next()

    const responseHeaders = new Headers()

    const { statusCode, headers, pipe } = pageContext.httpResponse

    headers.forEach(([name, value]) => {
      responseHeaders.set(name, value)
    })

    // Pass headers from hono ctx through to new response, excluding the content type header.
    const honoHeaders = ctx.newResponse("").headers.entries() as unknown as [
      string,
      string,
    ][]

    honoHeaders.forEach(([name, value]) => {
      if (name !== "content-type") {
        responseHeaders.set(name, value)
      }
    })

    return new Promise(function (resolve, reject) {
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
    const user = ctx.get("user")

    if (user) {
      return this.response(ctx).redirect(route("welcome")).send()
    }

    return this.page(ctx, next)
  }

  redirectToLoginIfNotAuthenticatedPage = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get("user")

    if (!user) {
      return this.response(ctx).redirect(route("auth_login")).send()
    }

    return this.page(ctx, next)
  }

  page = async (ctx: HonoContext, next: Next, pageProps?: Record<string, any>) => {
    const renderVikePage = container.make<VikePageRenderer>(ContainerKey.vikeRenderPage)

    const userAgentHeader = ctx.req.header("user-agent")

    const userAgent = userAgentHeader ? new UAParser(userAgentHeader) : undefined

    const audience = ctx.get("team")
      ? await container
          .make(AudienceRepository)
          .findForProduct(ctx.get("team")?.id, "letters")
      : undefined

    return renderVikePage(ctx, next, {
      ...pageProps,
      user: excludeKeys(ctx.get("user"), [
        "emailVerificationCodeExpiresAt",
        "emailVerificationCode",
        "password",
      ]),
      flash: ctx.get("flash"),
      userAgent: userAgent
        ? {
            browser: userAgent.getBrowser(),
            os: userAgent.getOS(),
            device: userAgent.getDevice(),
          }
        : undefined,
      isMobile: userAgent?.getDevice().type === "mobile",
      memberships: ctx.get("memberships"),
      team: excludeKeys(ctx.get("team"), ["commerceProviderAccountId"]),
      letters: {
        audience,
      },
    })
  }
}
