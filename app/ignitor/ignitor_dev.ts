import { Ignitor } from "./ignitor.js"
import { GetPagePropsAction } from "@/app/actions/get_page_props_action.js"
import { serve } from "@hono/node-server"
import { createReadableStreamFromReadable } from "@remix-run/node"
import { readFile } from "fs/promises"
import { Server } from "https"
import { createServer as createHttpsServer } from "node:https"
import path from "path"
import { PassThrough } from "stream"
import { renderPage } from "vike/server"
import { createServer as createViteServer } from "vite"

import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class IgnitorDev extends Ignitor {
  protected httpsServer: Server
  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
    })

    this.httpsServer = createHttpsServer()

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
          pageProps: await container
            .make(GetPagePropsAction)
            .handle(ctx as unknown as HonoContext),
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
        createServer: createHttpsServer,
        serverOptions: {
          key: await readFile(
            path.resolve(process.cwd(), "certs", "localhost-key.pem"),
          ),
          cert: await readFile(
            path.resolve(process.cwd(), "certs", "localhost.pem"),
          ),
        },
      },
      ({ address, port }) => {
        console.log(`Monolith dev (HTTPS): 🌐 https://localhost:${port}`)
      },
    )

    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT + 100,
      },
      ({ address, port }) => {
        console.log(
          `Monolith dev (HTTP only): 🌐 http://localhost:${port}`,
        )
      },
    )
  }
}
