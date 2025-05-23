import { apply } from 'vike-server/hono'
import { serve } from 'vike-server/hono/serve'

import { Ignitor } from '#root/core/app/ignitor/ignitor.js'

const ignitor = new Ignitor().boot()

apply(ignitor.app, {
  async pageContext(runtime) {
    return {
      math: 1 + 1,
    }
  },
})

await ignitor.start(({ env, app }) => serve(app, { port: env.PORT })).catch(console.error)
