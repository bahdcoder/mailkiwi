import { appEnv } from '#root/core/app/env/app_env.js'
import { ProcessMtaLogJob } from '#root/core/kumologs/jobs/process_mta_log_job.js'
import { DateTime } from 'luxon'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import type { MtaLog } from '#root/core/shared/types/mta.js'
import {
  type DecodedSignature,
  SignedUrlManager,
} from '#root/core/shared/utils/links/signed_url_manager.js'

/**
 * ClickTrackingController handles email link click tracking and redirects.
 *
 * This controller is a critical component of Kibamail's email analytics system, responsible for:
 * 1. Intercepting clicks on tracked links in emails
 * 2. Verifying the authenticity of tracking signatures
 * 3. Recording click events with metadata (recipient, device, location, etc.)
 * 4. Redirecting the user to the original destination URL
 *
 * The controller works with links that have been rewritten by the InjectTrackingLinksIntoEmailAction
 * class during email sending. When a recipient clicks a tracked link, they're briefly routed through
 * this controller, which logs the click event before redirecting them to the intended destination.
 *
 * This tracking enables essential marketing features like click-through rate measurement,
 * engagement analytics, and automation triggers based on link interactions.
 */
export class ClickTrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // Define the route that handles tracked link clicks
    // The :signature parameter contains the encoded original URL and metadata
    this.app.defineRoutes([['GET', '/c/:signature', this.index.bind(this)]], {
      prefix: '',
      middleware: [],
    })
  }

  /**
   * Records a click event in the tracking system.
   *
   * This method queues a click tracking event for processing:
   * 1. Captures the recipient's IP address for geolocation
   * 2. Records the user agent for device/browser analytics
   * 3. Timestamps the event for time-based analytics
   * 4. Associates the click with the specific email send using metadata
   *
   * The event is queued for asynchronous processing to ensure fast response times
   * for the redirect, providing a seamless experience for recipients while still
   * capturing all necessary tracking data.
   *
   * @param ctx - The HTTP context containing request information
   * @param signature - The decoded tracking signature with metadata
   * @param log - Additional log data to include in the event
   */
  async queueLog(ctx: HonoContext, signature: DecodedSignature, log?: Partial<MtaLog>) {
    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log: {
        type: 'Click',
        // Capture IP address for geolocation (using standard proxy headers)
        ipv4_address: ctx.req.header('x-forwarded-for') || ctx.req.header('x-real-ip'),
        // Record user agent for device/browser analytics
        user_agent: ctx.req.header('user-agent'),
        // Timestamp the event for time-based analytics
        timestamp: DateTime.now().toSeconds(),
        // Associate the click with the specific email send
        headers: {
          [appEnv.emailHeaders.emailSendId]: signature?.metadata?.m,
        },
        ...log,
      },
    })
  }

  /**
   * Handles tracked link clicks and performs the redirect.
   *
   * This method implements the core click tracking workflow:
   * 1. Decodes and verifies the tracking signature from the URL
   * 2. Records the click event for analytics
   * 3. Redirects the user to the original destination URL
   *
   * If the signature is invalid or tampered with, the user is redirected to
   * the Kibamail website as a safety measure to prevent open redirect vulnerabilities.
   *
   * The method is designed to execute quickly to minimize any perceived delay
   * for the recipient during the redirect process.
   *
   * @param ctx - The HTTP context containing the request and signature
   * @returns HTTP redirect response to the original URL or fallback
   */
  async index(ctx: HonoContext): Promise<Response> {
    // Decode and verify the tracking signature from the URL
    const unsigned = this.getDecodedSignature(ctx)

    // If the signature is invalid or tampered with, redirect to the Kibamail website
    // This prevents open redirect vulnerabilities from invalid or forged signatures
    if (!unsigned) {
      return ctx.redirect('https://kibamail.com')
    }

    // Record the click event for analytics
    // This is done asynchronously to minimize redirect delay
    await this.queueLog(ctx, unsigned)

    // TODO: Get the contactId from the signature and automatically create a login session.

    // Redirect the user to the original destination URL
    return ctx.redirect(unsigned.original)
  }
}
