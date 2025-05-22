import * as Sentry from '@sentry/node'
import type { HonoContext } from '@/shared/server/types.js'
import type { Next } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { container } from '@/utils/typi.js'
import { ContainerKey } from '@/shared/container/index.js'
import type { Logger } from 'pino'

/**
 * SentryMiddleware captures errors and sends them to Sentry
 *
 * This middleware should be registered after all controllers and before any
 * other error middleware to ensure it catches all errors.
 */
export class SentryMiddleware {
  /**
   * Handle the request and capture any errors
   */
  async handle(ctx: HonoContext, next: Next) {
    try {
      const user = ctx.get('user')
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
        })
      }

      const team = ctx.get('team')

      if (team) {
        Sentry.setTag('team.id', team.id)
        Sentry.setTag('team.name', team.name)
      }

      Sentry.setContext('request', {
        url: ctx.req.url,
        method: ctx.req.method,
        headers: Object.fromEntries(ctx.req.raw.headers.entries()),
      })

      return await next()
    } catch (error) {
      Sentry.captureException(error)

      const logger = container.make<Logger>(ContainerKey.logger)
      logger.error(error)

      const statusCode: ContentfulStatusCode =
        error instanceof Error && 'status' in error
          ? (error as Error & { status: ContentfulStatusCode }).status
          : 500

      return ctx.json({ error: 'An unexpected error occurred' }, statusCode)
    }
  }
}
