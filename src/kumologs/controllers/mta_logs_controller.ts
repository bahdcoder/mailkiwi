import { makeMtaLogProcessorApp } from "@/shared/container/index.ts"
import { HonoContext } from "@/shared/server/types.js"

export class MtaLogsController {
  constructor(private app = makeMtaLogProcessorApp()) {
    this.app.defineRoutes([["POST", "/mta/logs", this.index.bind(this)]], {
      prefix: "/",
    })
  }

  async index(ctx: HonoContext) {
    console.log({ ctx: await ctx.req.json() })

    // TODO: Pipe logs to Kafka / NATS / Redis Streams for processing

    return ctx.json({ message: "OK" })
  }
}
