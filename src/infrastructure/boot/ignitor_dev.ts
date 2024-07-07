import Vite from "@fastify/vite"

import { Ignitor } from "./ignitor.js"

export class IgnitorDev extends Ignitor {
  async startSinglePageApplication() {
    await this.app.register(Vite, {
      root: `${process.cwd()}`,
      dev: true,
      spa: true,
    })

    await this.app.vite.ready()
  }
}
