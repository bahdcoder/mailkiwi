import { ContainerKey } from "../container/index.js"
import { VikePageRenderer, VikeRenderPage } from "../types/vike.js"
import { createReadableStreamFromReadable } from "@remix-run/node"
import { Handler, MiddlewareHandler, Next } from "hono"
import { PassThrough } from "stream"
import { renderPage } from "vike/server"

import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext, HonoRouteDefinition } from "@/shared/server/types.js"

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
      urlOriginal: ctx.req.url,
      headersOriginal: ctx.req.raw.headers,
    })

    if (!pageContext.httpResponse) return next()

    const responseHeaders = new Headers()

    const { statusCode, headers, pipe } = pageContext.httpResponse

    headers.forEach(([name, value]) => responseHeaders.set(name, value))

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

  page = async (ctx: HonoContext, next: Next, pageProps?: Record<string, any>) => {
    const renderVikePage = container.make<VikePageRenderer>(ContainerKey.vikeRenderPage)

    return renderVikePage(ctx, next, pageProps)
  }
}
