import { IgnitorDev } from "@/api/ignitor/ignitor_api_dev.js"
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
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.PORT,
      },
      ({ address, port }) => {
        console.log(`Monolith: 🌐 http://${address}:${port}`)
      },
    )
  }
}
