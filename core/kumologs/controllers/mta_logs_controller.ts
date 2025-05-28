import { ProcessMtaLogJob } from '#root/core/kumologs/jobs/process_mta_log_job.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

/**
 * MtaLogsController handles mail transfer agent (MTA) log processing.
 *
 * This controller is responsible for:
 * 1. Receiving log data from the mail server
 * 2. Queuing logs for asynchronous processing
 * 3. Enabling email delivery tracking and analytics
 *
 * MTA logs provide critical information about email delivery status,
 * including bounces, deliveries, and other events that are essential
 * for monitoring email campaign performance and deliverability.
 */
export class MtaLogsController {
  constructor(private app = makeApp()) {
    this.app.defineRoutes([['POST', '/mta/logs', this.index.bind(this)]], {
      prefix: '/',
      middleware: [],
    })
  }

  /**
   * Processes incoming MTA log events.
   *
   * Receives log data from the mail server and queues it for
   * asynchronous processing to update email delivery status
   * and analytics without blocking the mail server.
   */
  async index(ctx: HonoContext) {
    const log = await ctx.req.json()

    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log,
    })

    return ctx.json({ ok: true })
  }
}
