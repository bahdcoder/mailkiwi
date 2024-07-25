import { serve } from '@hono/node-server'
import { createServer as createViteServer } from 'vite'
import { Ignitor } from './ignitor.js'

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
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
    serve({
      fetch: this.app.fetch,
      port: this.env.PORT,
    })

    console.log(`🌐 http://127.0.0.1:${this.env.PORT}`)
  }
}
