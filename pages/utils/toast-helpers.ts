import { toast } from 'sonner'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function handleEmailChangeError(error: any) {
  const errorMessage = error?.payload?.errors?.[0]?.message || error.message

  switch (errorMessage) {
    case 'The new email address must be different from your current email.':
      toast.error('Please enter a different email address')
      break
    case 'This email address is already in use by another account.':
      toast.error('This email is already taken. Please try another.')
      break
    case 'Please provide a valid email address in the format example@domain.com':
      toast.error('Please enter a valid email address')
      break
    case 'Invalid or expired verification code. Please try again.':
      toast.error('Invalid code. Please check your email and try again.')
      break
    case 'No email change request found. Please initiate an email change first.':
      toast.error('Please start the email change process first')
      break
    default:
      toast.error('Something went wrong. Please try again.')
  }
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function handleError(error: any) {
  const errorMessage = error?.payload?.errors?.[0]?.message || error.message || error
  toast.error(errorMessage)
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function handleSuccess(data: any) {
  const message = data?.payload?.message || data?.message || data
  toast.success(message)
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function handleWarning(data: any) {
  const message = data?.payload?.message || data?.message || data
  toast.warning(message)
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function handleInfo(data: any) {
  const message = data?.payload?.message || data?.message || data
  toast.info(message)
}
