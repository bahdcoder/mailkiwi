import { InjectEmailSchema } from "@/injector/dto/inject_email_dto.ts"
import { injectorEnv } from "@/injector/env/injector_env.ts"

import { makeMtaInjectorApp } from "@/shared/container/index.ts"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { makeHttpClient } from "@/shared/http/http_client.ts"
import { HonoContext } from "@/shared/server/types.js"

export class InjectEmailController extends BaseController {
  constructor(private app = makeMtaInjectorApp()) {
    super()

    this.app.defineRoutes([["POST", "/", this.index.bind(this)]])
  }

  async index(ctx: HonoContext) {
    const payload = await this.validate(ctx, InjectEmailSchema)

    const { data, error } = await makeHttpClient()
      .url(`${injectorEnv.MTA_INJECTOR_URL}/api/inject/v1`)
      .post()
      .payload({
        envelope_sender: payload.from.email,
        recipients: payload.recipients,
        content: {
          from: payload.from,
          subject: payload.subject,
          reply_to: payload.replyTo,
          text_body: payload.text,
          html_body: payload.html,
          attachments: payload.attachments,
          headers: payload.headers,
        },
      })
      .send()

    return ctx.json({ Ok: true })
  }
}
