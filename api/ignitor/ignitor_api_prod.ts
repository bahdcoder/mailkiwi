import { IgnitorDev } from "@/api/ignitor/ignitor_api_dev.js"
import { serveStatic } from "@hono/node-server/serve-static"
import { compress } from "hono/compress"
import { resolve } from "path"

export class IgnitorProd extends IgnitorDev {
  async startSinglePageApplication() {
    this.app.use(compress())
    this.app.get("/assets/*", serveStatic({ root: "build/client" }))

    this.registerCatchAllServerRoute()
  }
}
