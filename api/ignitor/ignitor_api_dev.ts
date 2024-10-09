import { Ignitor } from "./ignitor_api.js"
import { GetPagePropsAction } from "@/api/actions/get_page_props_action.js"
import { serve } from "@hono/node-server"
import { createReadableStreamFromReadable } from "@remix-run/node"
import { PassThrough } from "stream"
import { renderPage } from "vike/server"
import { createServer as createViteServer } from "vite"

import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { container } from "@/utils/typi.js"

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
    })

    this.app.use(async (ctx, next) => {
      await new Promise((resolve) => {
        viteDevServer.middlewares.handle(
          ctx.env.incoming,
          ctx.env.outgoing,
          async () => {
            return resolve(next())
          },
        )
      })
    })

    this.registerCatchAllServerRoute()
  }

  protected registerCatchAllServerRoute() {
    this.app.all(
      "*",
      container.make(UserSessionMiddleware).handle,
      async function (ctx, next) {
        const pageContext = await renderPage({
          urlOriginal: ctx.req.url,
          headersOriginal: ctx.req.raw.headers,
          pageProps: await container.make(GetPagePropsAction).handle({
            path: ctx.req.path,
            queries: ctx.req.queries(),
            routePath: ctx.req.routePath,
          }),
        })

        if (!pageContext.httpResponse) return next()

        const responseHeaders = new Headers()

        const { statusCode, headers, pipe } = pageContext.httpResponse

        headers.forEach(([name, value]) =>
          responseHeaders.set(name, value),
        )

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
      },
    )
  }

  async startHttpServer() {
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT,
      },
      ({ address, port }) => {
        console.log(`Monolith API: 🌐 http://${address}:${port}`)
      },
    )
  }
}
