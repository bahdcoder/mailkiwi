# Change Email API

## Overview

The Change Email functionality allows authenticated users to update their email address through a secure two-phase verification process. This ensures that users have access to the new email address before the change is finalized.

## Process Flow

1. **Initiate**: User provides new email address
2. **Verify**: User enters 6-digit code sent to new email
3. **Complete**: Email address is updated and verified

## Endpoints

### 1. Initiate Email Change

- **URL**: `POST /auth/email/change/initiate`
- **Authentication**: Required (User session)
- **Content-Type**: `application/json`

#### Request Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | New email address (must be valid format and unique) |

#### Example Request

```javascript
const response = await fetch('/auth/email/change/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'newemail@example.com'
  })
})

const result = await response.json()
```

#### Success Response

**Status Code**: `200 OK`

```json
{
  "type": "json",
  "payload": {
    "message": "Verification code sent to your new email address"
  }
}
```

#### Error Responses

##### Same Email Address
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "The new email address must be different from your current email.",
        "field": "email"
      }
    ]
  }
}
```

##### Email Already Exists
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "This email address is already in use by another account.",
        "field": "email"
      }
    ]
  }
}
```

##### Invalid Email Format
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Please provide a valid email address in the format example@domain.com",
        "field": "email"
      }
    ]
  }
}
```

### 2. Confirm Email Change

- **URL**: `POST /auth/email/change/confirm`
- **Authentication**: Required (User session)
- **Content-Type**: `application/json`

#### Request Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | 6-digit verification code sent to new email |

#### Example Request

```javascript
const response = await fetch('/auth/email/change/confirm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: '123456'
  })
})

const result = await response.json()
```

#### Success Response

**Status Code**: `200 OK`

```json
{
  "type": "json",
  "payload": {
    "message": "Email address changed successfully"
  }
}
```

#### Error Responses

##### No Pending Request
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "No email change request found. Please initiate an email change first.",
        "field": "code"
      }
    ]
  }
}
```

##### Invalid Code
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Invalid or expired verification code. Please try again.",
        "field": "code"
      }
    ]
  }
}
```

##### Invalid Code Format
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Verification code must be exactly 6 digits",
        "field": "code"
      }
    ]
  }
}
```

### 3. Cancel Email Change

- **URL**: `DELETE /auth/email/change/cancel`
- **Authentication**: Required (User session)
- **Content-Type**: `application/json`

#### Example Request

```javascript
const response = await fetch('/auth/email/change/cancel', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  }
})

const result = await response.json()
```

#### Success Response

**Status Code**: `200 OK`

```json
{
  "type": "json",
  "payload": {
    "message": "Email change request cancelled successfully"
  }
}
```

#### Error Response

##### No Pending Request
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "No email change request found to cancel."
      }
    ]
  }
}
```

## Frontend Integration Examples

### Complete Email Change Flow with Kibamail Components

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Card } from '@kibamail/owly/card'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React, { useState } from 'react'

function ChangeEmailForm() {
  const [step, setStep] = useState<'initiate' | 'confirm'>('initiate')
  const [newEmail, setNewEmail] = useState('')

  // Step 1: Initiate email change
  const {
    isPending: isInitiating,
    serverFormProps: initiateFormProps,
    error: initiateError
  } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/initiate',
    onSuccess() {
      setStep('confirm')
    },
    transform(form) {
      setNewEmail(form.email as string)
      return form
    }
  })

  // Step 2: Confirm email change
  const {
    isPending: isConfirming,
    serverFormProps: confirmFormProps,
    error: confirmError,
    isSuccess
  } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/confirm',
    onSuccess() {
      // Redirect or refresh user data
      window.location.reload()
    }
  })

  // Cancel email change
  const {
    isPending: isCancelling,
    serverFormProps: cancelFormProps
  } = useServerFormMutation({
    method: 'DELETE',
    action: '/auth/email/change/cancel',
    onSuccess() {
      setStep('initiate')
      setNewEmail('')
    }
  })

  if (isSuccess) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            ✓
          </div>
          <div>
            <Heading size="sm">Email Changed Successfully</Heading>
            <Text className="kb-content-tertiary">
              Your email address has been updated to {newEmail}
            </Text>
          </div>
        </div>
      </Card>
    )
  }

  if (step === 'initiate') {
    return (
      <Card className="p-6">
        <Heading size="sm">Change Email Address</Heading>
        <Text className="kb-content-tertiary mt-2">
          Enter your new email address to receive a verification code
        </Text>

        <ServerForm {...initiateFormProps} className="mt-6">
          <TextField.Root
            name="email"
            type="email"
            required
            placeholder="newemail@example.com"
          >
            <TextField.Label>New Email Address</TextField.Label>
            {initiateError?.errorsMap?.email ? (
              <TextField.Error>{initiateError.errorsMap.email}</TextField.Error>
            ) : null}
          </TextField.Root>

          <Button type="submit" width="full" className="mt-4" loading={isInitiating}>
            {isInitiating ? 'Sending Code...' : 'Send Verification Code'}
          </Button>
        </ServerForm>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Heading size="sm">Verify New Email</Heading>
      <Text className="kb-content-tertiary mt-2">
        Enter the 6-digit code sent to <strong>{newEmail}</strong>
      </Text>

      <ServerForm {...confirmFormProps} className="mt-6">
        <TextField.Root
          name="code"
          type="text"
          required
          placeholder="123456"
          maxLength={6}
          pattern="\d{6}"
        >
          <TextField.Label>Verification Code</TextField.Label>
          {confirmError?.errorsMap?.code ? (
            <TextField.Error>{confirmError.errorsMap.code}</TextField.Error>
          ) : null}
        </TextField.Root>

        <div className="flex gap-2 mt-4">
          <Button type="submit" loading={isConfirming}>
            {isConfirming ? 'Verifying...' : 'Confirm Email Change'}
          </Button>

          <ServerForm {...cancelFormProps} className="inline">
            <Button
              type="submit"
              variant="tertiary"
              loading={isCancelling}
              disabled={isConfirming}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          </ServerForm>
        </div>
      </ServerForm>
    </Card>
  )
}
```

### Settings Page Integration

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Card } from '@kibamail/owly/card'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React, { useState } from 'react'

interface User {
  email: string
  unconfirmedEmail?: string
}

function EmailSettingsSection({ user }: { user: User }) {
  const [showEmailForm, setShowEmailForm] = useState(false)

  const { isPending, serverFormProps, error, isSuccess } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/initiate',
    onSuccess() {
      setShowEmailForm(false)
    }
  })

  const {
    isPending: isCancelling,
    serverFormProps: cancelFormProps
  } = useServerFormMutation({
    method: 'DELETE',
    action: '/auth/email/change/cancel',
    onSuccess() {
      // Refresh user data
      window.location.reload()
    }
  })

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading size="sm">Email Address</Heading>
          <Text className="kb-content-tertiary">
            {user.email}
          </Text>
          {user.unconfirmedEmail && (
            <Text className="kb-content-warning text-sm mt-1">
              Pending verification: {user.unconfirmedEmail}
            </Text>
          )}
        </div>
        {!showEmailForm && !user.unconfirmedEmail && (
          <Button
            variant="secondary"
            onClick={() => setShowEmailForm(true)}
          >
            Change Email
          </Button>
        )}
      </div>

      {user.unconfirmedEmail && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <Text className="text-sm">
            We've sent a verification code to <strong>{user.unconfirmedEmail}</strong>.
            Check your email and enter the code to complete the change.
          </Text>
          <div className="mt-2">
            <ServerForm {...cancelFormProps} className="inline">
              <Button
                type="submit"
                variant="tertiary"
                size="sm"
                loading={isCancelling}
              >
                Cancel Email Change
              </Button>
            </ServerForm>
          </div>
        </div>
      )}

      {showEmailForm && (
        <ServerForm {...serverFormProps} className="mt-6">
          <TextField.Root
            name="email"
            type="email"
            required
            placeholder="newemail@example.com"
            defaultValue={user.email}
          >
            <TextField.Label>New Email Address</TextField.Label>
            {error?.errorsMap?.email ? (
              <TextField.Error>{error.errorsMap.email}</TextField.Error>
            ) : null}
          </TextField.Root>

          <div className="flex gap-2 mt-4">
            <Button type="submit" loading={isPending}>
              {isPending ? 'Sending...' : 'Send Verification Code'}
            </Button>
            <Button
              variant="tertiary"
              onClick={() => setShowEmailForm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </ServerForm>
      )}
    </Card>
  )
}
```

### Email Verification Dialog Component

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Dialog } from '@kibamail/owly/dialog'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

interface EmailVerificationDialogProps {
  isOpen: boolean
  onClose: () => void
  newEmail: string
  onSuccess: () => void
}

function EmailVerificationDialog({
  isOpen,
  onClose,
  newEmail,
  onSuccess
}: EmailVerificationDialogProps) {
  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/confirm',
    onSuccess() {
      onSuccess()
      onClose()
    }
  })

  const {
    isPending: isCancelling,
    serverFormProps: cancelFormProps
  } = useServerFormMutation({
    method: 'DELETE',
    action: '/auth/email/change/cancel',
    onSuccess() {
      onClose()
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>Verify New Email</Dialog.Title>
          <Dialog.Description>
            Enter the 6-digit code sent to <strong>{newEmail}</strong>
          </Dialog.Description>
        </Dialog.Header>

        <ServerForm {...serverFormProps} className="mt-6">
          <TextField.Root
            name="code"
            type="text"
            required
            placeholder="123456"
            maxLength={6}
            pattern="\d{6}"
            autoFocus
          >
            <TextField.Label>Verification Code</TextField.Label>
            {error?.errorsMap?.code ? (
              <TextField.Error>{error.errorsMap.code}</TextField.Error>
            ) : null}
          </TextField.Root>

          <Dialog.Footer className="mt-6">
            <ServerForm {...cancelFormProps} className="inline">
              <Button
                type="submit"
                variant="tertiary"
                loading={isCancelling}
                disabled={isPending}
              >
                Cancel
              </Button>
            </ServerForm>
            <Button type="submit" loading={isPending}>
              {isPending ? 'Verifying...' : 'Verify Email'}
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog>
  )
}
```

## Security Notes

- **Two-Phase Verification**: Ensures users have access to the new email before changing
- **Unique Email Validation**: Prevents duplicate email addresses across accounts
- **Code Expiration**: Verification codes expire after a set time for security
- **Current Email Preserved**: Original email remains verified throughout the process
- **Cancellation Support**: Users can abandon the change without affecting their account
- **Rate Limiting**: Multiple requests are throttled to prevent abuse

## Business Rules

1. **Email Uniqueness**: Each email address can only be associated with one account
2. **Different Email Required**: New email must be different from current email
3. **Valid Format**: Email must follow standard email format validation
4. **Active Session Required**: User must be authenticated to change email
5. **One Request at a Time**: Only one email change request can be pending per user
6. **Verification Required**: New email must be verified before the change is finalized

## Error Handling Best Practices

```tsx
// Comprehensive error handling example
function handleEmailChangeError(error: any) {
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
```

## Related Endpoints

- `GET /auth/profile` - Get current user profile information
- `POST /auth/register/email/confirm` - Confirm email during registration
- `POST /auth/passwords/change` - Change user password