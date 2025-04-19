import { appEnv } from '@/app/env/app_env.js'
import { ProcessMtaLogJob } from '@/kumologs/jobs/process_mta_log_job.js'
import { DateTime } from 'luxon'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import { Queue } from '@/shared/queue/queue.js'
import type { HonoContext } from '@/shared/server/types.js'
import type { MtaLog } from '@/shared/types/mta.js'
import {
  type DecodedSignature,
  SignedUrlManager,
} from '@/shared/utils/links/signed_url_manager.js'

export class ClickTrackingController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes([['GET', '/c/:signature', this.index.bind(this)]], {
      prefix: '',
      middleware: [],
    })
  }

  async queueLog(ctx: HonoContext, signature: DecodedSignature, log?: Partial<MtaLog>) {
    await Queue.mta_logs().add(ProcessMtaLogJob.id, {
      log: {
        type: 'Click',
        ipv4_address: ctx.req.header('x-forwarded-for') || ctx.req.header('x-real-ip'),
        user_agent: ctx.req.header('user-agent'),
        timestamp: DateTime.now().toSeconds(),
        headers: {
          [appEnv.emailHeaders.emailSendId]: signature?.metadata?.m,
        },
        ...log,
      },
    })
  }

  async index(ctx: HonoContext): Promise<Response> {
    const unsigned = this.getDecodedSignature(ctx)

    if (!unsigned) {
      return ctx.redirect('https://kibamail.com')
    }

    await this.queueLog(ctx, unsigned)

    // TODO: Get the contactId from the signature and automatically create a login session.

    return ctx.redirect(unsigned.original)
  }
}
