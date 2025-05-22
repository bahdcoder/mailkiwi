import * as Sentry from '@sentry/node'
import { appEnv } from '../env/app_env.js'

/**
 * Initialize Sentry for error tracking
 *
 * This module initializes Sentry as early as possible in the application lifecycle.
 * It configures Sentry with the appropriate DSN and environment settings.
 */
export function initSentry() {
  Sentry.init({
    dsn: 'https://de939b1583e043d561bfaecc64189b22@sentry.kibamail.com/2',
    environment: appEnv.NODE_ENV,
    enabled: !appEnv.isTest, // Disable in test environment
    tracesSampleRate: appEnv.isProd ? 0.2 : 1.0, // Sample 20% of transactions in production, all in dev
    integrations: [
      // Enable HTTP capturing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Hono(),
    ],
  })

  return Sentry
}

// Initialize Sentry immediately
const sentry = initSentry()

export default sentry
