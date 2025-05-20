import { Heading } from '@kibamail/owly/heading'
import * as Sentry from '@sentry/react' // Ensure Sentry is imported

function DashboardPage() {
  const handleClientErrorTest = () => {
    throw new Error('Sentry Client Test Error - Kibamail - Timestamp: ' + Date.now())
  }

  const handleClientMessageTest = () => {
    Sentry.captureMessage('Sentry Client Test Message - Kibamail - Timestamp: ' + Date.now())
    alert('Sentry test message sent. Check Sentry.io.')
  }

  const handleClientCapturedExceptionTest = () => {
    try {
      // Simulate a caught error
      throw new Error('Simulated caught error for Sentry Test - Kibamail - Timestamp: ' + Date.now())
    } catch (e) {
      Sentry.captureException(e, {
        extra: {
          description: 'This was a caught exception manually sent to Sentry.',
          timestamp: Date.now(),
        },
      })
      alert('Sentry captured exception sent. Check Sentry.io.')
    }
  }

  return (
    <div className="p-8">
      <Heading>Your Kibamail dashboard.</Heading>
      {/* Sentry Test Area (Temporary) - START */}
      <div style={{ marginTop: '20px', border: '1px dashed #ccc', padding: '10px' }}>
        <h2>Sentry Test Area (Temporary)</h2>
        <p>These buttons are for testing Sentry integration. Remember to remove this section after verification.</p>
        <button
          onClick={handleClientErrorTest}
          style={{ border: '1px solid red', padding: '5px', margin: '5px', color: 'red', fontWeight: 'bold' }}
        >
          Throw Client Error (Test Sentry ErrorBoundary)
        </button>
        <button
          onClick={handleClientMessageTest}
          style={{ border: '1px solid blue', padding: '5px', margin: '5px', color: 'blue' }}
        >
          Send Sentry Test Message
        </button>
        <button
          onClick={handleClientCapturedExceptionTest}
          style={{ border: '1px solid orange', padding: '5px', margin: '5px', color: 'orange' }}
        >
          Send Sentry Captured Exception
        </button>
      </div>
      {/* Sentry Test Area (Temporary) - END */}
    </div>
  )
}

export { DashboardPage as Page }
