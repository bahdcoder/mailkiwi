import './styles.css'
import type React from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@sentry/react'
import { usePageContext } from 'vike-react/usePageContext'

/**
 * Error fallback component displayed when an error occurs in the application.
 */
function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-6">
        We've been notified about this issue and are working to fix it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh the page
      </button>
    </div>
  )
}

function RootLayout({ children }: React.PropsWithChildren) {
  const { urlOriginal } = usePageContext()

  if (urlOriginal.includes('docs')) {
    return <>{children}</>
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <ErrorBoundary fallback={<ErrorFallback />}>
        <div className="w-full h-screen border-l border-r kb-border-tertiary">
          {children}
        </div>
      </ErrorBoundary>
    </>
  )
}

export { RootLayout as Layout }
