import { appEnv } from "@/app/env/app_env.js"
import { ClickTrackingController } from "@/tracking/controllers/click_tracking_controller.js"

import { makeApp } from "@/shared/container/index.js"
import { HonoContext } from "@/shared/server/types.js"

export class OpenTrackingController extends ClickTrackingController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([["GET", "/o/:signature", this.index.bind(this)]], {
      prefix: "",
      middleware: [],
    })
  }

  protected oneByOnePngPx = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
    0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00,
    0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78,
    0xda, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
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
    const unsigned = this.getDecodedSignature(ctx)

    if (!unsigned) {
      return this.respondWithTrackingImage()
    }

    await this.queueLog(ctx, unsigned, {
      type: "Open",
      headers: {
        [appEnv.emailHeaders.emailSendId]: unsigned.original,
      },
    })

    return this.respondWithTrackingImage()
  }
}
