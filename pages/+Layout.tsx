import './styles.css'
import type React from 'react'
import { Toaster } from 'sonner'
import * as Sentry from '@sentry/react'

// Initialize Sentry for React client-side
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: `kibamail-client@${import.meta.env.VITE_APP_VERSION}`,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})

// Define a fallback component for Sentry ErrorBoundary
function SentryFallbackComponent() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>An error has occurred</h2>
      <p>Our team has been notified. Please try refreshing the page or contact support if the problem persists.</p>
    </div>
  )
}

function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <Sentry.ErrorBoundary fallback={<SentryFallbackComponent />}>
      <Toaster />
      <div className="w-full h-screen border-l border-r kb-border-tertiary">
        {children}
      </div>
    </Sentry.ErrorBoundary>
  )
}

export { RootLayout as Layout }
