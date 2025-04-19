import { Ignitor } from './ignitor.js'
import { WebsocketServer } from '@/chat/websocket/websocket_server.js'
import { createAdaptorServer, serve } from '@hono/node-server'
import { readFile } from 'node:fs/promises'
import type { Next } from 'hono/types'
import type { Server } from 'node:https'
import { createServer as createHttpsServer } from 'node:https'
import path from 'node:path'
import { createServer as createViteServer } from 'vite'
import { EnsureUserAndTeamSessionsMiddleware } from '@/auth/middleware/ensure_user_and_team_sessions_middleware.js'
import { VikeController } from '@/shared/controllers/vike_controller.js'
import type { HonoContext } from '@/shared/server/types.js'
import { container } from '@/utils/typi.js'
import { makeLogger } from '@/shared/container/index.js'

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
    const handler = (ctx: HonoContext, next: Next) =>
      container.make(VikeController).page(ctx as unknown as HonoContext, next)

    this.app.get(
      '/w/*',
      container.make(EnsureUserAndTeamSessionsMiddleware).handle,
      handler,
    )

    this.app.get('/auth/*', handler)

    this.app.all('*', handler)
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
      ({ address, port }) => {
        logger.info(`Monolith dev (HTTP only): 🌐 http://localhost:${port}`)
      },
    )
  }
}
