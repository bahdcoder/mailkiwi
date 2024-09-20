import { MtaLogsController } from "@/kumologs/controllers/mta_logs_controller.ts"
import {
  MtaLogProcessorEnv,
  mtaLogProcessorEnv,
} from "@/kumologs/env/mta_log_processor_env.ts"
import { HonoMtaLogProcessor } from "@/kumologs/server/hono_mta_logprocessor.ts"
import { serve } from "@hono/node-server"

import { ContainerKey } from "@/shared/container/index.ts"
import { HonoInstance } from "@/shared/server/hono.js"

import { container } from "@/utils/typi.ts"

export class IgnitorMtaLogProcessor {
  protected app: HonoInstance
  protected env: MtaLogProcessorEnv

  boot() {
    this.env = mtaLogProcessorEnv
    container.register(ContainerKey.env, this.env)

    this.app = new HonoMtaLogProcessor()
    container.register(ContainerKey.mtaLogProcessorApp, this.app)

    container.resolve(MtaLogsController)

    return this
  }

  async startHttpServer() {
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.MTA_LOG_PROCESSOR_PORT,
      },
      ({ address, port }) => {
        console.log(`MTA Log Processor: 🌐 http://${address}:${port}`)
      },
    )
  }

  async start() {
    await this.startHttpServer()
  }
}
