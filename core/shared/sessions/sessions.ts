import { appEnv } from '#root/core/app/env/app_env.js'
import { makeRedis } from '#root/core/shared/container/index.js'

import { Session as FrameworkSession } from '@kibamail/framework'

export class Session extends FrameworkSession {
  constructor() {
    super(makeRedis(), appEnv)
  }
}
