import { readFile } from 'node:fs/promises'
// No Next import needed
import type { Server } from 'node:https'
import { createServer as createHttpsServer } from 'node:https'
import path from 'node:path'
import { EnsureUserAndTeamSessionsMiddleware } from '@/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { WebsocketServer } from '@/chat/websocket/websocket_server.js'
import { makeLogger } from '@/shared/container/index.js'
import { VikeController } from '@/shared/controllers/vike_controller.js'
// No HonoContext import needed
import { container } from '@/utils/typi.js'
import { createAdaptorServer, serve } from '@hono/node-server'
import { createServer as createViteServer } from 'vite'
import { Ignitor } from './ignitor.js'

export class IgnitorDev extends Ignitor {
  protected httpsServer: Server

  async startSinglePageApplication() {
    const viteDevServer = await createViteServer({
      server: { middlewareMode: true },
    })

    this.httpsServer = createHttpsServer()

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
      createServer: createHttpsServer,
      serverOptions: {
        key: await readFile(path.resolve(process.cwd(), 'certs', 'localhost-key.pem')),
        cert: await readFile(path.resolve(process.cwd(), 'certs', 'localhost.pem')),
      },
    }) as Server

    new WebsocketServer(server)

    const logger = makeLogger()

    server.listen(this.env.PORT, () => {
      logger.info(`Monolith dev (HTTPS): 🌐 https://localhost:${this.env.PORT}`)
    })

    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT + 100,
      },
      ({ port }) => {
        logger.info(`Monolith dev (HTTP only): 🌐 http://localhost:${port}`)
      },
    )
  }
}
