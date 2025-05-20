import * as Sentry from '@sentry/node'
import { appEnv } from '@/app/env/app_env.js'
import { type Logger } from 'pino'

/**
 * Initialize Sentry for server-side error tracking
 * @param logger - The application logger
 * @param version - The application version
 */
export function initServerSentry(logger: Logger, version: string): void {
  if (!appEnv.SENTRY_DSN) {
    logger.info('Sentry DSN not provided, skipping Sentry initialization')
    return
  }

  Sentry.init({
    dsn: appEnv.SENTRY_DSN,
    environment: appEnv.NODE_ENV,
    release: version,
    tracesSampleRate: appEnv.isProd ? 0.2 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.Undici(),
    ],
    beforeSend(event) {
      // Don't send events in test environment
      if (appEnv.isTest) {
        return null
      }
      return event
    },
  })

  logger.info('Sentry initialized for server-side error tracking')
}

/**
 * Capture an exception with Sentry
 * @param error - The error to capture
 * @param context - Additional context for the error
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, { extra: context })
}

/**
 * Set user information for Sentry events
 * @param user - User information
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user)
}

/**
 * Clear user information from Sentry context
 */
export function clearUser(): void {
  Sentry.setUser(null)
}

/**
 * Set extra context for Sentry events
 * @param key - Context key
 * @param value - Context value
 */
export function setExtra(key: string, value: any): void {
  Sentry.setExtra(key, value)
}

/**
 * Set tag for Sentry events
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value)
}

/**
 * Create Sentry transaction
 * @param name - Transaction name
 * @param op - Operation name
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({ name, op })
}

/**
 * Flush Sentry events before application shutdown
 */
export async function flushSentry(): Promise<boolean> {
  return Sentry.close()
}