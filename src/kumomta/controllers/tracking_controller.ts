import { apiEnv } from "@/api/env/api_env.js"
import { AuthorizeMtaCallsMiddleware } from "@/kumomta/middleware/authorize_mta_calls_middleware.js"
import { writeFile, writeFileSync } from "fs"
import { simpleParser } from "mailparser"
import { Splitter } from "mailsplit"
import Joiner from "mailsplit/lib/message-joiner"
import Rewriter from "mailsplit/lib/node-rewriter"
import MailComposer from "nodemailer/lib/mail-composer"
import { Address } from "nodemailer/lib/mailer/index.js"
import { resolve } from "path"
import { Readable } from "stream"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

export class TrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["POST", "/mta/smtp/message", this.store.bind(this)]],
      {
        prefix: "/",
        middleware: [container.make(AuthorizeMtaCallsMiddleware).handle],
      },
    )
  }

  async store(ctx: HonoContext) {
    const { message } = await ctx.req.json()

    // 🚗 TODO:PERFORMANCE takes ~100ms for average sized email
    // const parsed = await simpleParser(message, { skipHtmlToText: false })
    await writeFileSync("log_email.eml", message)

    const rewriter = new Rewriter((node) =>
      ["text/html"].includes(node.contentType),
    )

    rewriter.on("node", function (data) {
      // let chunks = []
      // let chunklen = 0

      // data.decoder.on("data", (chunk: any) => {
      //   chunks.push(chunk)
      //   chunklen += chunk.length
      // })

      // data.decoder.on("end", function () {})

      // data.encoder.end()

      data.decoder.pipe(data.encoder)
    })

    const messageStream = Readable.from(message)

    const out = messageStream
      .pipe(new Splitter())
      .pipe(rewriter)
      .pipe(new Joiner())

    out.on("end", console.log)

    // new MailComposer({
    //   from: parsed.from as unknown as Address,
    //   to: parsed.to as unknown as Address,
    //   subject: parsed.subject,
    //   messageId: parsed.messageId,
    //   headers: {},
    //   // attachments: parsed.attachments,
    // })

    // //
    // console.dir({ parsed }, { depth: null })

    return ctx.json({ content: message })
  }
}
