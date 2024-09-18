import { logger } from "hono/logger"

import { Hono } from "@/shared/server/hono.js"

export class HonoMtaLogProcessor extends Hono {
  constructor() {
    super()

    this.use(logger())
  }
}
