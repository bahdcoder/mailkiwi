import * as Sentry from '@sentry/react'

function isSentryEnabled() {
  return false
}

/**
 * Initialize Sentry for client-side error tracking.
 *
 * This function sets up Sentry with the appropriate configuration for the client environment.
 * It should be called as early as possible in the application lifecycle.
 */
if (isSentryEnabled()) {
  Sentry.init({
    dsn: 'https://de939b1583e043d561bfaecc64189b22@sentry.kibamail.com/2',
    // todo: make this dynamic
    environment: 'development',
    release: 'kibamail@1.0.0',
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
  })
}

/**
 * ErrorBoundary component for React applications.
 *
 * This component wraps parts of the application to catch and report unhandled errors.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary
