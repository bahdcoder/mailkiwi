import React from 'react'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { WarningTriangleSolidIcon } from '#root/pages/components/icons/warning-triangle-solid.svg.js'

/**
 * Error page component displayed when an error occurs in the application.
 *
 * This page provides a user-friendly error message and options to refresh
 * the page or return to the dashboard.
 */
function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-(--background-primary) px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8 flex justify-center">
          <WarningTriangleSolidIcon className="w-20 h-20 text-(--color-warning)" />
        </div>

        <Heading size="lg" className="mb-4 text-(--text-primary)">
          Something went wrong
        </Heading>

        <Text className="mb-8 text-(--text-secondary)">
          We've encountered an unexpected error and our team has been notified. We're
          working to fix the issue as quickly as possible.
        </Text>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.reload()} type="button">
            Refresh the page
          </Button>

          <Button
            onClick={() => {
              window.location.href = '/w/dashboard'
            }}
            variant="secondary"
            type="button"
          >
            Return to dashboard
          </Button>
        </div>

        <Text className="mt-8 text-sm text-(--text-tertiary)">
          If the problem persists, please contact support.
        </Text>
      </div>
    </div>
  )
}

export { Page }
