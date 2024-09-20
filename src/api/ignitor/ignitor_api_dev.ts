import { Ignitor } from "./ignitor_api.js"
import { serve } from "@hono/node-server"
import { createServer as createViteServer } from "vite"

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {
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
