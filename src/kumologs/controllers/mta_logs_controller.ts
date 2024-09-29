import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"

import { makeApp } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"
import { HonoContext } from "@/shared/server/types.js"

export class MtaLogsController {
  constructor(private app = makeApp()) {
    this.app.defineRoutes([["POST", "/mta/logs", this.index.bind(this)]], {
      prefix: "/",
      middleware: [],
    })
  }

  async index(ctx: HonoContext) {
    console.dir({ json: await ctx.req.json() }, { depth: null })
    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log: await ctx.req.json(),
    })

    return ctx.json({ ok: true })
  }
}
