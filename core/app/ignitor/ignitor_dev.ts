import type { Server } from 'node:http'
import { createServer as createHttpServer } from 'node:http'
import { EnsureUserAndTeamSessionsMiddleware } from '@/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { WebsocketServer } from '@/chat/websocket/websocket_server.js'
import { makeLogger } from '@/shared/container/index.js'
import { VikeController } from '@/shared/controllers/vike_controller.js'
import { container } from '@/utils/typi.js'
import { createAdaptorServer } from '@hono/node-server'
import { createServer as createViteServer } from 'vite'
import { Ignitor } from './ignitor.js'

export class IgnitorDev extends Ignitor {
  protected httpServer: Server

  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
    })

    this.httpServer = createHttpServer()

    this.app.use(async (ctx, next) => {
      await new Promise((resolve) => {
        viteDevServer.middlewares.handle(ctx.env.incoming, ctx.env.outgoing, async () => {
          return resolve(next())
        })
      })
    })

    this.registerCatchAllServerRoute()
  }

  protected registerCatchAllServerRoute() {
    // @ts-ignore - Ignoring type issues with Hono middleware
    this.app.get(
      '/w/*',
      // @ts-ignore - Ignoring type issues with Hono middleware
      container.make(EnsureUserAndTeamSessionsMiddleware).handle,
      // @ts-ignore - Ignoring type issues with Hono middleware
      (ctx, next) => {
        // @ts-ignore - Ignoring type issues with Hono middleware
        return container.make(VikeController).page(ctx, next)
      },
    )

    // @ts-ignore - Ignoring type issues with Hono middleware
    this.app.get(
      '/auth/*',
      // @ts-ignore - Ignoring type issues with Hono middleware
      (ctx, next) => {
        // @ts-ignore - Ignoring type issues with Hono middleware
        return container.make(VikeController).page(ctx, next)
      },
    )

    // @ts-ignore - Ignoring type issues with Hono middleware
    this.app.all(
      '*',
      // @ts-ignore - Ignoring type issues with Hono middleware
      (ctx, next) => {
        // @ts-ignore - Ignoring type issues with Hono middleware
        return container.make(VikeController).page(ctx, next)
      },
    )
  }

  async startHttpServer() {
    const server = createAdaptorServer({
      fetch: this.app.fetch,
      port: this.env.PORT,
      createServer: createHttpServer,
    }) as Server

    new WebsocketServer(server)

    const logger = makeLogger()

    server.listen(this.env.PORT, () => {
      logger.info(`Monolith dev (HTTP): 🌐 http://localhost:${this.env.PORT}`)
    })
  }
}
