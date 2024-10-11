import { apiEnv } from "@/api/env/api_env.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { Queue } from "@/shared/queue/queue.js"
import { HonoContext } from "@/shared/server/types.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

export class OpenTrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["GET", "/o/:signature", this.index.bind(this)]],
      {
        prefix: "",
        middleware: [],
      },
    )
  }

  protected oneByOnePngPx = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0xda, 0x63, 0x60, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  protected respondWithTrackingImage() {
    const headers = new Headers()

    headers.set("Content-Type", "image/png")
    headers.set("Content-Length", this.oneByOnePngPx.length.toString())

    return new Response(this.oneByOnePngPx, {
      headers,
    })
  }

  async index(ctx: HonoContext) {
    const unsigned = new SignedUrlManager(apiEnv.APP_KEY).decode(
      ctx.req.param("signature"),
    )

    if (!unsigned) {
      return this.respondWithTrackingImage()
    }

    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log: {
        // add other fields here, including a user agent.
        type: "Open",
        headers: {
          [apiEnv.emailHeaders.emailSendId]: unsigned?.metadata?.m,
        },
      },
    })

    return this.respondWithTrackingImage()
  }
}
