import { Readable } from 'node:stream'
import { appEnv } from '#root/core/app/env/app_env.js'
import { load as cheerioLoad } from 'cheerio'
import iconv from 'iconv-lite'
import { Joiner, Rewriter, Splitter } from 'mailsplit'

import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'
import { stringFromReadableStream } from '#root/core/shared/utils/string.js'

interface TrackedLink {
  url: string
  id: string
}

/**
 * InjectTrackingLinksIntoEmailAction handles email tracking injection for opens and clicks.
 *
 * This class is a critical component of Kibamail's email analytics system, responsible for:
 * 1. Rewriting all links in HTML emails to pass through Kibamail's tracking servers
 * 2. Injecting invisible tracking pixels to detect when emails are opened
 * 3. Preserving the original email structure and encoding
 * 4. Maintaining security through cryptographic signatures
 *
 * The tracking system enables essential marketing features like:
 * - Open rate analytics
 * - Click-through rate measurement
 * - Geographic and device tracking
 * - Engagement-based segmentation
 * - Automation triggers based on email interactions
 *
 * The implementation uses a streaming approach with mailsplit to handle emails of any size
 * efficiently while preserving MIME structure and character encodings.
 */
export class InjectTrackingLinksIntoEmailAction {
  constructor(protected signedUrlManager = new SignedUrlManager(appEnv.APP_KEY)) {}

  /**
   * Rewrites all links in an HTML email to enable click tracking.
   *
   * This method implements the core link tracking functionality:
   * 1. Parses the HTML using Cheerio (jQuery-like HTML parser)
   * 2. Finds all <a> tags with href attributes
   * 3. For each link, creates a cryptographically signed tracking URL
   * 4. Replaces the original href with the tracking URL
   * 5. Preserves links marked with disable-tracking="true" attribute
   *
   * When a recipient clicks a tracked link, they're first directed to Kibamail's
   * tracking server, which records the click event with metadata (recipient, email,
   * campaign, etc.) before redirecting to the original destination URL.
   *
   * The tracking URLs include cryptographic signatures to prevent tampering and
   * ensure the integrity of the redirect process.
   *
   * @param html - The HTML content of the email
   * @param trackingDomain - The domain to use for tracking (e.g., track.example.com)
   * @param metadata - Additional data to include in the tracking URL (email ID, etc.)
   * @returns The modified HTML with tracked links and a list of tracking signatures
   */
  rewriteHrefAttributes(
    html: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    // Parse the HTML using Cheerio (jQuery-like HTML parser)
    const $ = cheerioLoad(html)

    // Store original URLs and their corresponding tracking signatures
    const trackingSignatures: [string, string][] = []

    // Process each <a> tag in the HTML
    $('a').each((idx, element) => {
      const href = $(element).attr('href')

      // Skip links without href attributes
      if (!href) return

      // Check if tracking is explicitly disabled for this link
      // This allows customers to exclude specific links from tracking
      const disableTracking = $(element).attr('disable-tracking')
      if (disableTracking === 'true') {
        return
      }

      // Create a cryptographically signed tracking URL
      const encodedHref = this.signedUrlManager.encode(href, metadata)

      // Store the original URL and its tracking signature for later reference
      trackingSignatures.push([href, encodedHref])

      // Replace the original href with the tracking URL
      const trackedHref = `https://${trackingDomain}/c/${encodedHref}`
      $(element).attr('href', trackedHref)
    })

    // Return the modified HTML and the list of tracking signatures
    return { html: $.html(), trackingSignatures }
  }

  /**
   * Injects an invisible tracking pixel into an HTML email to detect opens.
   *
   * This method implements the open tracking functionality:
   * 1. Creates a cryptographically signed tracking URL for the pixel
   * 2. Generates an invisible 1x1 pixel image tag with the tracking URL
   * 3. Injects the pixel before the closing </body> tag if present
   * 4. Otherwise appends the pixel at the end of the HTML
   *
   * When a recipient opens the email and their email client loads images,
   * the tracking pixel is requested from Kibamail's servers, which records
   * the open event with metadata about the recipient and email.
   *
   * The tracking pixel is designed to be invisible to recipients while still
   * providing accurate open tracking data for analytics.
   *
   * @param html - The HTML content of the email
   * @param trackingDomain - The domain to use for tracking (e.g., track.example.com)
   * @param metadata - Additional data to include in the tracking URL (email ID, etc.)
   * @returns The modified HTML with the tracking pixel and related tracking data
   */
  injectTrackingPixel(
    html: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    // Create a cryptographically signed tracking URL for the pixel
    const signature = this.signedUrlManager.encode(metadata?.m as string)

    // Generate an invisible 1x1 pixel image tag with the tracking URL
    // The pixel is transparent and has minimal dimensions to be invisible to recipients
    const pixel = /*html*/ `<img src="https://${trackingDomain}/o/${signature}" alt="" width="1" height="1" />`

    let trackedHtml: string

    // Insert the pixel before the closing </body> tag if present
    // This ensures the pixel is properly loaded in the email client
    if (/<\/body\b/i.test(html)) {
      trackedHtml = html.replace(/<\/body\b/i, (match) => `\r\n${pixel}\r\n${match}`)
    } else {
      // If no </body> tag is found, append the pixel at the end of the HTML
      trackedHtml = `${html}\r\n${pixel}`
    }

    return { pixel, signature, html: trackedHtml }
  }

  /**
   * Processes a complete email message to add both link and open tracking.
   *
   * This method handles the full email processing workflow:
   * 1. Splits the email into its MIME parts using mailsplit
   * 2. Identifies HTML content parts for tracking injection
   * 3. Handles various character encodings correctly
   * 4. Applies both link rewriting and pixel injection
   * 5. Reassembles the email with tracking elements added
   *
   * The method uses a streaming approach with mailsplit to efficiently process
   * emails of any size while preserving the MIME structure and character encodings.
   * This ensures that the tracking injection doesn't break email formatting or
   * cause display issues in email clients.
   *
   * @param message - The complete email message as a string
   * @param trackingDomain - The domain to use for tracking (e.g., track.example.com)
   * @param metadata - Additional data to include in tracking URLs (email ID, etc.)
   * @returns The modified email message with tracking elements added
   */
  async handle(
    message: string,
    trackingDomain: string,
    metadata?: Record<string, string>,
  ) {
    // Create a rewriter that only processes HTML content parts
    // This ensures we don't modify text parts or attachments
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
