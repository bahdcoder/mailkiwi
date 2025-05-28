import { appEnv } from '#root/core/app/env/app_env.js'
import { ClickTrackingController } from '#root/core/tracking/controllers/click_tracking_controller.js'

import { makeApp } from '#root/core/shared/container/index.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

/**
 * OpenTrackingController handles email open tracking via invisible pixels.
 *
 * This controller is a critical component of Kibamail's email analytics system, responsible for:
 * 1. Detecting when recipients open emails by loading invisible tracking pixels
 * 2. Verifying the authenticity of tracking signatures
 * 3. Recording open events with metadata (recipient, device, location, etc.)
 * 4. Serving a transparent 1x1 pixel image that's invisible to recipients
 *
 * The controller works with tracking pixels that have been injected by the
 * InjectTrackingLinksIntoEmailAction class during email sending. When a recipient
 * opens an email and their email client loads images, this controller is called
 * to record the open event.
 *
 * This tracking enables essential marketing features like open rate measurement,
 * engagement analytics, and automation triggers based on email opens.
 */
export class OpenTrackingController extends ClickTrackingController {
  constructor(protected app = makeApp()) {
    super()

    // Define the route that handles tracking pixel requests
    // The :signature parameter contains the encoded email ID and metadata
    this.app.defineRoutes([['GET', '/o/:signature', this.index.bind(this)]], {
      prefix: '',
      middleware: [],
    })
  }

  /**
   * Binary data for a transparent 1x1 PNG pixel.
   *
   * This is a minimal, transparent PNG image used as the tracking pixel.
   * The image is deliberately invisible to recipients while still allowing
   * the email client to make a request to our server, which enables us to
   * track when the email is opened.
   *
   * Using a proper PNG image rather than an empty response ensures compatibility
   * with all email clients and prevents errors that might alert users to the
   * tracking mechanism.
   */
  protected oneByOnePngPx = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
    0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00,
    0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78,
    0xda, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])

  /**
   * Creates an HTTP response containing the tracking pixel image.
   *
   * This method prepares the HTTP response for the tracking pixel:
   * 1. Sets the appropriate Content-Type header for a PNG image
   * 2. Sets the Content-Length header for proper HTTP handling
   * 3. Returns the transparent 1x1 pixel as the response body
   *
   * The response is carefully crafted to be as lightweight as possible
   * while still being recognized as a valid image by all email clients.
   *
   * @returns HTTP response containing the transparent tracking pixel
   */
  protected respondWithTrackingImage() {
    const headers = new Headers()

    // Set appropriate headers for a PNG image
    headers.set('Content-Type', 'image/png')
    headers.set('Content-Length', this.oneByOnePngPx.length.toString())

    // Return the transparent pixel as the response body
    return new Response(this.oneByOnePngPx, {
      headers,
    })
  }

  /**
   * Handles tracking pixel requests and records email opens.
   *
   * This method implements the core open tracking workflow:
   * 1. Decodes and verifies the tracking signature from the URL
   * 2. Records the open event for analytics
   * 3. Returns a transparent 1x1 pixel image
   *
   * Unlike click tracking, this method always returns the tracking pixel
   * even if the signature is invalid, as the user isn't being redirected
   * and there's no security risk in serving the image.
   *
   * The method is designed to execute quickly to minimize any loading delay
   * that might be noticeable to recipients.
   *
   * @param ctx - The HTTP context containing the request and signature
   * @returns HTTP response containing the transparent tracking pixel
   */
  async index(ctx: HonoContext) {
    // Decode and verify the tracking signature from the URL
    const unsigned = this.getDecodedSignature(ctx)

    // If the signature is invalid, still return the tracking pixel
    // but don't record an open event
    if (!unsigned) {
      return this.respondWithTrackingImage()
    }

    // Record the open event for analytics
    // This is done asynchronously to minimize response delay
    await this.queueLog(ctx, unsigned, {
      type: 'Open',
      headers: {
        [appEnv.emailHeaders.emailSendId]: unsigned.original,
      },
    })

    // Return the transparent tracking pixel
    return this.respondWithTrackingImage()
  }
}
