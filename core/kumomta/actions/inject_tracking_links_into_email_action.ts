import { appEnv } from '@/app/env/app_env.js'
import { load as cheerioLoad } from 'cheerio'
import iconv from 'iconv-lite'
import { Joiner, Rewriter, Splitter } from 'mailsplit'
import { Readable } from 'node:stream'

import { SignedUrlManager } from '@/shared/utils/links/signed_url_manager.js'
import { stringFromReadableStream } from '@/shared/utils/string.js'

interface TrackedLink {
  url: string
  id: string
}

export class InjectTrackingLinksIntoEmailAction {
  constructor(protected signedUrlManager = new SignedUrlManager(appEnv.APP_KEY)) {}

  rewriteHrefAttributes(
    html: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    const $ = cheerioLoad(html)

    const trackingSignatures: [string, string][] = []

    $('a').each((idx, element) => {
      const href = $(element).attr('href')

      if (!href) return

      const disableTracking = $(element).attr('disable-tracking')

      if (disableTracking === 'true') {
        return
      }

      const encodedHref = this.signedUrlManager.encode(href, metadata)

      trackingSignatures.push([href, encodedHref])

      const trackedHref = `https://${trackingDomain}/c/${encodedHref}`

      $(element).attr('href', trackedHref)
    })

    return { html: $.html(), trackingSignatures }
  }

  injectTrackingPixel(
    html: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    const signature = this.signedUrlManager.encode(metadata?.m as string)

    const pixel = /*html*/ `<img src="https://${trackingDomain}/o/${signature}" alt="" width="1" height="1" />`

    let trackedHtml: string

    if (/<\/body\b/i.test(html)) {
      trackedHtml = html.replace(/<\/body\b/i, (match) => `\r\n${pixel}\r\n${match}`)
    } else {
      trackedHtml = `${html}\r\n${pixel}`
    }

    return { pixel, signature, html: trackedHtml }
  }

  async handle(
    message: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    const rewriter = new Rewriter((node) => ['text/html'].includes(node.contentType))

    rewriter.on('node', (data) => {
      const chunks: Uint8Array[] = []
      let chunklen = 0

      data.decoder.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk)
        chunklen += chunk.length
      })

      data.decoder.on('end', () => {
        const htmlBuffer = Buffer.concat(chunks, chunklen)
        let html: string

        if (data.node.charset) {
          html = iconv.decode(htmlBuffer, data.node.charset)
        } else {
          html = htmlBuffer.toString('binary')
        }

        data.node.setCharset('utf-8')

        const { html: trackedHtml } = this.rewriteHrefAttributes(
          html,
          trackingDomain,
          metadata,
        )

        const { html: opensTrackedHtml } = this.injectTrackingPixel(
          trackedHtml,
          trackingDomain,
          metadata,
        )

        data.encoder.end(Buffer.from(opensTrackedHtml))
      })
    })

    const messageStream = Readable.from(message)

    return stringFromReadableStream(
      messageStream.pipe(new Splitter()).pipe(rewriter).pipe(new Joiner()),
    )
  }
}
