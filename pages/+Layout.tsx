import './styles.css'
import type React from 'react'
import { Toaster } from 'sonner'
import { SentryErrorBoundary, initClientSentry } from './sentry'
import { useEffect } from 'react'

// Fallback component for Sentry error boundary
const ErrorFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-4">
        We've been notified about this issue and are working to fix it.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload page
      </button>
    </div>
  </div>
)

function RootLayout({ children }: React.PropsWithChildren) {
  // Initialize Sentry on client-side
  useEffect(() => {
    // Get environment variables from window.__INITIAL_STATE__ if available
    const state = (window as any).__INITIAL_STATE__ || {}
    const env = state.env || {}
    
    initClientSentry(
      env.SENTRY_DSN || '',
      env.NODE_ENV || 'development',
      env.APP_VERSION || 'unknown'
    )
  }, [])

  return (
    <>
      <Toaster />
      <SentryErrorBoundary fallback={ErrorFallback}>
        <div className="w-full h-screen border-l border-r kb-border-tertiary">
          {children}
        </div>
      </SentryErrorBoundary>
    </>
  )
}

export { RootLayout as Layout }
