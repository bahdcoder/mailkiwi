import { serve } from "@hono/node-server"

import { Ignitor } from "./ignitor.js"

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {}

  async startHttpServer() {
    serve({
      fetch: this.app.fetch,
      port: this.env.PORT,
    })
    console.log(`http://0.0.0.0:${this.env.PORT}`)
  }
}
