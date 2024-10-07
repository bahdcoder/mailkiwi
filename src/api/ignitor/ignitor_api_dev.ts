import { Ignitor } from "./ignitor_api.js"
import { serve } from "@hono/node-server"
import * as build from "@remix-run/dev/server-build.js"
import next from "next"
import { remix } from "remix-hono/handler"
import { createServer as createViteServer } from "vite"

export class IgnitorDev extends Ignitor {
  async _startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
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
  }

  async startSinglePageApplication() {
    this.app.use(
      "/remix/*",
      remix({
        build,
        mode: this.env.isDev ? "development" : "production",
      }),
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
