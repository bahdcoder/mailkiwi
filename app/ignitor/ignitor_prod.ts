import { IgnitorDev } from "@/app/ignitor/ignitor_dev.js"
import { makeLogger } from "@/shared/container/index.js"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { compress } from "hono/compress"

export class IgnitorProd extends IgnitorDev {
  async startSinglePageApplication() {
    this.app.use(compress())
    this.app.get("/assets/*", serveStatic({ root: "build/client" }))

    this.registerCatchAllServerRoute()
  }

  async startHttpServer() {
    const logger = makeLogger()
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT,
      },
      ({ address, port }) => {
        logger.info(`Monolith: 🌐 http://${address}:${port}`)
      }
    )
  }
}
