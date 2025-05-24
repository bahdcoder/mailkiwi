import { apply } from 'vike-server/hono'
import { serve } from 'vike-server/hono/serve'

import { Ignitor } from '#root/core/app/ignitor/ignitor.js'

import { pageContext } from './page.context.js'
const ignitor = await new Ignitor().boot().start()

apply(ignitor.app, {
  pageContext,
})

export function start() {
  serve(ignitor.app, { port: ignitor.env.PORT })
}
