import { captureException } from '@/shared/sentry/index.js'
import { E_REQUEST_EXCEPTION } from '@/http/responses/errors.js'
import type { MiddlewareHandler } from 'hono'

/**
 * Middleware to capture exceptions with Sentry
 */
export const sentryErrorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      // Only capture server errors (500s) or non-E_REQUEST_EXCEPTION errors
      if (
        error instanceof E_REQUEST_EXCEPTION
          ? error.statusCode >= 500
          : error instanceof Error
      ) {
        captureException(error instanceof Error ? error : new Error(String(error)), {
          path: c.req.path,
          method: c.req.method,
          headers: Object.fromEntries(c.req.raw.headers.entries()),
        })
      }
      
      // Re-throw the error to be handled by other error handlers
      throw error
    }
  }
}