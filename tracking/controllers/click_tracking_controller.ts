import { apiEnv } from "@/api/env/api_env.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Queue } from "@/shared/queue/queue.js"
import { HonoContext } from "@/shared/server/types.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

export class ClickTrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["GET", "/c/:signature", this.index.bind(this)]],
      {
        prefix: "",
        middleware: [],
      },
    )
  }

  async index(ctx: HonoContext) {
    // extract signature from params
    const signature = ctx.req.param("signature")

    const signatureManager = new SignedUrlManager(apiEnv.APP_KEY)

    const unsigned = signatureManager.decode(signature)

    if (!unsigned) {
      return ctx.redirect("https://kibamail.com")
    }

    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log: {
        // add other fields here, including a user agent.
        type: "Click",
        headers: {
          [apiEnv.emailHeaders.emailSendId]: unsigned?.metadata?.m,
        },
      },
    })

    return ctx.redirect(unsigned.original)
  }
}
