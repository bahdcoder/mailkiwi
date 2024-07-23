import { serve } from '@hono/node-server'
import { createServer as createViteServer } from 'vite'
import { Ignitor } from './ignitor.js'

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {
    // createServer
    const vite = await createViteServer({
      // server: { middlewareMode: true },
      appType: 'custom',
    })
  }

  async startHttpServer() {
    serve({
      fetch: this.app.fetch,
      port: this.env.PORT,
    })
    console.log(`http://0.0.0.0:${this.env.PORT}`)
  }
}
