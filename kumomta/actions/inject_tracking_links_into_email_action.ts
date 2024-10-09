import { apiEnv } from "@/api/env/api_env.js";
import { load as cheerioLoad } from "cheerio";
import iconv from "iconv-lite";
import { Splitter } from "mailsplit";
import Joiner from "mailsplit/lib/message-joiner"
import Rewriter from "mailsplit/lib/node-rewriter"
import { Readable } from "stream";



import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js";
import { stringFromReadableStream } from "@/shared/utils/string.js";


interface TrackedLink {
  url: string
  id: string
}

export class InjectTrackingLinksIntoEmailAction {
  rewriteHrefAttributes(html: string, trackingDomain: string) {
    const $ = cheerioLoad(html)

    const signedUrlManager = new SignedUrlManager(apiEnv.APP_KEY)

    $("a").each(function (idx, element) {
      const href = $(element).attr("href")
      if (!href) return

      const trackedHref = `http://${trackingDomain}/c/${signedUrlManager.encode(href)}`

      $(element).attr("href", trackedHref)
    })

    return { html: $.html() }
  }

  async handle(message: string, trackingDomain: string) {
    const rewriter = new Rewriter((node) =>
      ["text/html"].includes(node.contentType),
    )

    const self = this

    rewriter.on("node", function (data) {
      let chunks: Uint8Array[] = []
      let chunklen = 0

      data.decoder.on("data", function (chunk: Uint8Array) {
        chunks.push(chunk)
        chunklen += chunk.length
      })

      data.decoder.on("end", function () {
        let htmlBuffer = Buffer.concat(chunks, chunklen)
        let html: string

        if (data.node.charset) {
          html = iconv.decode(htmlBuffer, data.node.charset)
        } else {
          html = htmlBuffer.toString("binary")
        }

        data.node.setCharset("utf-8")

        const { html: trackedHtml } = self.rewriteHrefAttributes(
          html,
          trackingDomain,
        )

        data.encoder.end(Buffer.from(trackedHtml))
      })
    })

    const messageStream = Readable.from(message)

    return stringFromReadableStream(
      messageStream.pipe(new Splitter()).pipe(rewriter).pipe(new Joiner()),
    )
  }
}