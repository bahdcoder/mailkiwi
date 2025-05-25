# Change Password API

## Overview

The Change Password endpoint allows authenticated users to update their account password by providing their current password and a new password that meets security requirements.

## Endpoint Details

- **URL**: `POST /auth/passwords/change`
- **Authentication**: Required (User session)
- **Content-Type**: `application/json`

## Request Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current password for verification |
| `newPassword` | string | Yes | New password (must meet security requirements) |
| `confirmNewPassword` | string | Yes | Confirmation of the new password (must match `newPassword`) |

### Password Security Requirements

The new password must contain:
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Example Request

```javascript
// Using fetch API
const response = await fetch('/auth/passwords/change', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    password: 'currentPassword123',
    newPassword: 'NewSecurePassword456',
    confirmNewPassword: 'NewSecurePassword456'
  })
})

const result = await response.json()
```

## Success Response

**Status Code**: `200 OK`

```json
{
  "type": "json",
  "payload": {
    "message": "Password changed successfully"
  }
}
```

## Error Responses

### 422 Validation Failed

#### Incorrect Current Password
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Your current password is incorrect.",
        "field": "password"
      }
    ]
  }
}
```

#### Password Confirmation Mismatch
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Please make sure your confirm password matches your new password.",
        "field": "confirmNewPassword"
      }
    ]
  }
}
```

#### Missing Required Fields
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Current password is required",
        "field": "password"
      },
      {
        "message": "New password must be a text value",
        "field": "newPassword"
      },
      {
        "message": "Please confirm your new password",
        "field": "confirmNewPassword"
      }
    ]
  }
}
```

#### Password Security Requirements Not Met
```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "Your new password must contain at least one capital letter for security",
        "field": "newPassword"
      },
      {
        "message": "Your new password must contain at least one lowercase letter for security",
        "field": "newPassword"
      },
      {
        "message": "Your new password must contain at least one number for security",
        "field": "newPassword"
      }
    ]
  }
}
```

### 401 Unauthorized

```json
{
  "type": "json",
  "payload": {
    "message": "Unauthorized"
  }
}
```

## Frontend Integration Examples

### Using Kibamail's Components and Patterns

```tsx
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

function ChangePasswordForm() {
  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'POST',
    action: '/auth/passwords/change',
    onSuccess() {
      // Show success message or redirect
      window.location.href = '/dashboard'
    }
  })

  return (
    <div className="w-full max-w-100 mx-auto mt-24">
      <Heading>Change Password</Heading>

      <Text className="kb-content-tertiary mt-2">
        Update your password to keep your account secure
      </Text>

      <ServerForm {...serverFormProps} className="mt-10 flex flex-col">
        <div className="grid grid-cols-1 gap-4">
          {/* Current Password Field */}
          <PasswordField
            name="password"
            placeholder="Enter your current password"
            required
          >
            <TextField.Label htmlFor="password">Current Password</TextField.Label>
            {error?.errorsMap?.password ? (
              <TextField.Error>{error.errorsMap.password}</TextField.Error>
            ) : null}
          </PasswordField>

          {/* New Password Field with Strength Indicator */}
          <PasswordField
            name="newPassword"
            placeholder="Create a new password"
            strengthIndicator
            required
          >
            <TextField.Label htmlFor="newPassword">New Password</TextField.Label>
            {error?.errorsMap?.newPassword ? (
              <TextField.Error className="mt-8">
                {error.errorsMap.newPassword}
              </TextField.Error>
            ) : null}
          </PasswordField>

          {/* Confirm New Password Field */}
          <PasswordField
            name="confirmNewPassword"
            placeholder="Confirm your new password"
            required
          >
            <TextField.Label htmlFor="confirmNewPassword">Confirm New Password</TextField.Label>
            {error?.errorsMap?.confirmNewPassword ? (
              <TextField.Error>{error.errorsMap.confirmNewPassword}</TextField.Error>
            ) : null}
          </PasswordField>
        </div>

        <Button type="submit" width="full" className="mt-6" loading={isPending}>
          {isPending ? 'Changing Password...' : 'Change Password'}
        </Button>
      </ServerForm>
    </div>
  )
}
```

### Settings Page Integration

```tsx
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
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

function SecuritySettingsSection() {
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const { isPending, serverFormProps, error, isSuccess } = useServerFormMutation({
    method: 'POST',
    action: '/auth/passwords/change',
    onSuccess() {
      setShowPasswordForm(false)
      // Show success notification
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
            <Heading size="sm">Password Changed Successfully</Heading>
            <Text className="kb-content-tertiary">
              Your password has been updated and you're all set.
            </Text>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading size="sm">Password</Heading>
          <Text className="kb-content-tertiary">
            Update your password to keep your account secure
          </Text>
        </div>
        {!showPasswordForm && (
          <Button
            variant="secondary"
            onClick={() => setShowPasswordForm(true)}
          >
            Change Password
          </Button>
        )}
      </div>

      {showPasswordForm && (
        <ServerForm {...serverFormProps} className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            <PasswordField
              name="password"
              placeholder="Enter your current password"
              required
            >
              <TextField.Label>Current Password</TextField.Label>
              {error?.errorsMap?.password ? (
                <TextField.Error>{error.errorsMap.password}</TextField.Error>
              ) : null}
            </PasswordField>

            <PasswordField
              name="newPassword"
              placeholder="Create a new password"
              strengthIndicator
              required
            >
              <TextField.Label>New Password</TextField.Label>
              {error?.errorsMap?.newPassword ? (
                <TextField.Error className="mt-8">
                  {error.errorsMap.newPassword}
                </TextField.Error>
              ) : null}
            </PasswordField>

            <PasswordField
              name="confirmNewPassword"
              placeholder="Confirm your new password"
              required
            >
              <TextField.Label>Confirm New Password</TextField.Label>
              {error?.errorsMap?.confirmNewPassword ? (
                <TextField.Error>{error.errorsMap.confirmNewPassword}</TextField.Error>
              ) : null}
            </PasswordField>
          </div>

          <div className="flex gap-2 mt-6">
            <Button type="submit" loading={isPending}>
              {isPending ? 'Changing...' : 'Change Password'}
            </Button>
            <Button
              variant="tertiary"
              onClick={() => setShowPasswordForm(false)}
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

### Modal Dialog Implementation

```tsx
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Dialog } from '@kibamail/owly/dialog'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React, { useState } from 'react'

function ChangePasswordDialog({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { isPending, serverFormProps, error, isSuccess } = useServerFormMutation({
    method: 'POST',
    action: '/auth/passwords/change',
    onSuccess() {
      onClose()
      // Show success notification
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Description>
            Update your password to keep your account secure
          </Dialog.Description>
        </Dialog.Header>

        <ServerForm {...serverFormProps} className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            <PasswordField
              name="password"
              placeholder="Enter your current password"
              required
            >
              <TextField.Label>Current Password</TextField.Label>
              {error?.errorsMap?.password ? (
                <TextField.Error>{error.errorsMap.password}</TextField.Error>
              ) : null}
            </PasswordField>

            <PasswordField
              name="newPassword"
              placeholder="Create a new password"
              strengthIndicator
              required
            >
              <TextField.Label>New Password</TextField.Label>
              {error?.errorsMap?.newPassword ? (
                <TextField.Error className="mt-8">
                  {error.errorsMap.newPassword}
                </TextField.Error>
              ) : null}
            </PasswordField>

            <PasswordField
              name="confirmNewPassword"
              placeholder="Confirm your new password"
              required
            >
              <TextField.Label>Confirm New Password</TextField.Label>
              {error?.errorsMap?.confirmNewPassword ? (
                <TextField.Error>{error.errorsMap.confirmNewPassword}</TextField.Error>
              ) : null}
            </PasswordField>
          </div>

          <Dialog.Footer className="mt-6">
            <Button
              variant="tertiary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog>
  )
}

// Usage in a settings page
function UserSettingsPage() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowPasswordDialog(true)}>
        Change Password
      </Button>

      <ChangePasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </div>
  )
}
```

## Security Notes

- The current password is verified before allowing the change
- The new password must meet strict security requirements
- Password confirmation prevents typos during password entry
- All password validation happens server-side for security
- Failed attempts are logged for security monitoring

## Related Endpoints

- `POST /auth/passwords/forgot` - Request password reset
- `POST /auth/passwords/reset/:token` - Reset password with token
- `GET /auth/profile` - Get user profile information