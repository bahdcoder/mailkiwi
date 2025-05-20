import * as Sentry from '@sentry/react'

// Initialize Sentry for client-side error tracking
export function initClientSentry(dsn: string, environment: string, release: string): void {
  if (!dsn) {
    console.info('Sentry DSN not provided, skipping client-side Sentry initialization')
    return
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance monitoring sample rate
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Session replay sample rate
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // Error sampling
    replaysOnErrorSampleRate: 1.0,
  })
}

// Create Sentry error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary