# Leave Team API

## Overview

The Leave Team endpoint allows authenticated team members to remove themselves from a team. This endpoint provides a self-service way for users to leave teams they no longer wish to be part of, while maintaining proper authorization and team ownership integrity.

## Endpoint Details

- **URL**: `DELETE /memberships/leave`
- **Authentication**: Required (User session)
- **Team Context**: Required (Team header)
- **Content-Type**: `application/json`

## Request Details

### Headers Required

| Header | Description | Example |
|--------|-------------|---------|
| `Cookie` | User session cookie | `session=encrypted_session_id` |
| `X-Team-Id` | Team ID to leave | `550e8400-e29b-41d4-a716-446655440000` |

### Request Body

No request body is required for this endpoint.

## Example Request

```javascript
// Using fetch API
const response = await fetch('/memberships/leave', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'X-Team-Id': 'team-id-to-leave'
  }
})

const result = await response.json()
```

## Success Response

**Status Code**: `200 OK`

```json
{
  "id": "membership-id-that-was-deleted"
}
```

The response contains the ID of the membership record that was removed.

## Error Responses

### 401 Unauthorized - Team Owner Cannot Leave

Team owners cannot leave their own teams to ensure teams always have an owner.

```json
{
  "type": "json",
  "payload": {
    "message": "Unauthorized: Team owners cannot leave their own team."
  }
}
```

### 422 Validation Failed - Not a Team Member

User is not a member of the specified team.

```json
{
  "type": "json",
  "payload": {
    "errors": [
      {
        "message": "You are not a member of this team."
      }
    ]
  }
}
```

### 401 Unauthorized - Authentication Required

User is not authenticated.

```json
{
  "type": "json",
  "payload": {
    "message": "Unauthorized"
  }
}
```

### 400 Bad Request - Invalid Team Context

Team ID header is missing or invalid.

```json
{
  "type": "json",
  "payload": {
    "message": "Invalid team selector provided."
  }
}
```

## Frontend Integration Examples

### Using Kibamail's Components and Patterns

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Card } from '@kibamail/owly/card'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import React, { useState } from 'react'

interface Team {
  id: string
  name: string
  isOwner: boolean
}

function LeaveTeamSection({ team }: { team: Team }) {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'DELETE',
    action: '/memberships/leave',
    onSuccess() {
      // Redirect to dashboard or default team
      window.location.href = '/dashboard'
    }
  })

  if (team.isOwner) {
    return (
      <Card className="p-6 border-orange-200 bg-orange-50">
        <Heading size="sm" className="text-orange-800">
          Team Ownership
        </Heading>
        <Text className="text-orange-700 mt-2">
          You cannot leave this team because you are the owner.
          To leave, you must first transfer ownership to another team member.
        </Text>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => window.location.href = `/teams/${team.id}/settings/members`}
        >
          Manage Team Members
        </Button>
      </Card>
    )
  }

  if (!showConfirmation) {
    return (
      <Card className="p-6">
        <Heading size="sm">Leave Team</Heading>
        <Text className="kb-content-tertiary mt-2">
          Remove yourself from "{team.name}". This action cannot be undone.
        </Text>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowConfirmation(true)}
        >
          Leave Team
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <Heading size="sm" className="text-red-800">
        Confirm Leave Team
      </Heading>
      <Text className="text-red-700 mt-2">
        Are you sure you want to leave "{team.name}"? You will lose access to all team resources and this action cannot be undone.
      </Text>

      {error?.message && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <Text className="text-red-800 text-sm">{error.message}</Text>
        </div>
      )}

      <ServerForm {...serverFormProps} className="mt-4">
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="danger"
            loading={isPending}
          >
            {isPending ? 'Leaving...' : 'Yes, Leave Team'}
          </Button>
          <Button
            variant="tertiary"
            onClick={() => setShowConfirmation(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </ServerForm>
    </Card>
  )
}
```

### Leave Team Dialog Component

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Dialog } from '@kibamail/owly/dialog'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import React, { useState } from 'react'

interface LeaveTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  team: {
    id: string
    name: string
    isOwner: boolean
  }
}

function LeaveTeamDialog({ isOpen, onClose, team }: LeaveTeamDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)

  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'DELETE',
    action: '/memberships/leave',
    onSuccess() {
      onClose()
      // Redirect to dashboard
      window.location.href = '/dashboard'
    }
  })

  const handleClose = () => {
    setIsConfirmed(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>Leave Team</Dialog.Title>
          <Dialog.Description>
            {team.isOwner
              ? 'You cannot leave a team you own'
              : `Remove yourself from "${team.name}"`
            }
          </Dialog.Description>
        </Dialog.Header>

        {team.isOwner ? (
          <div className="mt-6">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Text className="text-orange-800">
                As the team owner, you cannot leave this team.
                To leave, you must first transfer ownership to another team member.
              </Text>
            </div>

            <Dialog.Footer className="mt-6">
              <Button variant="tertiary" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => window.location.href = `/teams/${team.id}/settings/members`}
              >
                Manage Members
              </Button>
            </Dialog.Footer>
          </div>
        ) : (
          <div className="mt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-red-800">
                This action cannot be undone. You will lose access to all team resources.
              </Text>
            </div>

            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="rounded"
              />
              <Text className="text-sm">
                I understand that leaving this team is permanent
              </Text>
            </label>

            {error?.message && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <Text className="text-red-800 text-sm">{error.message}</Text>
              </div>
            )}

            <ServerForm {...serverFormProps}>
              <Dialog.Footer className="mt-6">
                <Button
                  variant="tertiary"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={!isConfirmed}
                  loading={isPending}
                >
                  {isPending ? 'Leaving...' : 'Leave Team'}
                </Button>
              </Dialog.Footer>
            </ServerForm>
          </div>
        )}
      </Dialog.Content>
    </Dialog>
  )
}

// Usage in a team settings page
function TeamSettingsPage({ team }: { team: Team }) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  return (
    <div>
      <Button
        variant="danger"
        onClick={() => setShowLeaveDialog(true)}
      >
        Leave Team
      </Button>

      <LeaveTeamDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        team={team}
      />
    </div>
  )
}
```

### Team Members List with Leave Action

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Card } from '@kibamail/owly/card'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import React from 'react'

interface TeamMember {
  id: string
  email: string
  role: string
  isCurrentUser: boolean
  isOwner: boolean
}

interface Team {
  id: string
  name: string
  members: TeamMember[]
}

function TeamMembersList({ team }: { team: Team }) {
  const currentUser = team.members.find(m => m.isCurrentUser)

  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'DELETE',
    action: '/memberships/leave',
    onSuccess() {
      // Redirect to dashboard
      window.location.href = '/dashboard'
    }
  })

  return (
    <Card className="p-6">
      <Heading size="sm">Team Members</Heading>

      <div className="mt-4 space-y-3">
        {team.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Text className="font-medium">{member.email}</Text>
              <Text className="text-sm kb-content-tertiary">
                {member.role} {member.isOwner && '(Owner)'}
              </Text>
            </div>

            {member.isCurrentUser && !member.isOwner && (
              <ServerForm {...serverFormProps} className="inline">
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={isPending}
                >
                  {isPending ? 'Leaving...' : 'Leave Team'}
                </Button>
              </ServerForm>
            )}

            {member.isCurrentUser && member.isOwner && (
              <Text className="text-sm kb-content-tertiary">
                Cannot leave (Owner)
              </Text>
            )}
          </div>
        ))}
      </div>

      {error?.message && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <Text className="text-red-800 text-sm">{error.message}</Text>
        </div>
      )}
    </Card>
  )
}
```

### Quick Action Button

```tsx
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import React from 'react'

function QuickLeaveTeamButton({
  teamName,
  isOwner,
  onSuccess
}: {
  teamName: string
  isOwner: boolean
  onSuccess?: () => void
}) {
  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'DELETE',
    action: '/memberships/leave',
    onSuccess() {
      onSuccess?.()
      // Redirect to dashboard
      window.location.href = '/dashboard'
    }
  })

  const handleClick = (e: React.MouseEvent) => {
    if (isOwner) {
      e.preventDefault()
      alert('You cannot leave a team you own. Transfer ownership first.')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to leave "${teamName}"? This action cannot be undone.`
    )

    if (!confirmed) {
      e.preventDefault()
    }
  }

  if (isOwner) {
    return (
      <Button
        variant="tertiary"
        disabled
        title="Team owners cannot leave their own team"
      >
        Cannot Leave (Owner)
      </Button>
    )
  }

  return (
    <div>
      <ServerForm {...serverFormProps} className="inline">
        <Button
          type="submit"
          variant="danger"
          size="sm"
          loading={isPending}
          onClick={handleClick}
        >
          {isPending ? 'Leaving...' : 'Leave Team'}
        </Button>
      </ServerForm>

      {error?.message && (
        <div className="mt-2 text-sm text-red-600">
          {error.message}
        </div>
      )}
    </div>
  )
}
```

## Team Context and Headers

The Leave Team endpoint requires proper team context to determine which team the user wants to leave. This is provided through the `X-Team-Id` header.

### How Team Context Works in Kibamail

```typescript
// Team context is typically managed through:

// 1. URL parameters (for team-specific pages)
const teamId = router.query.teamId

// 2. User's current active team session
const currentTeam = useCurrentTeam()

// 3. Explicit team selection
const selectedTeam = useTeamSelector()

// Example of making a request with proper team context
async function leaveCurrentTeam() {
  const currentTeam = getCurrentTeamFromSession()

  const response = await fetch('/memberships/leave', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Team-Id': currentTeam.id
    }
  })

  return response.json()
}
```

## Session Management After Leaving

When a user leaves a team, Kibamail automatically handles session management:

1. **Session Switch**: The user's active session is switched to their default team (first owned team)
2. **Redirect Handling**: Frontend should redirect users to an appropriate page after leaving
3. **Cache Invalidation**: Team-related data should be refreshed or invalidated

```typescript
// Example of handling post-leave session management
async function handleTeamLeave(teamId: string) {
  try {
    await leaveTeam(teamId)

    // Clear team-specific cached data
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    queryClient.invalidateQueries({ queryKey: ['team', teamId] })

    // Redirect to dashboard or default team
    router.push('/dashboard')

    // Show success message
    toast.success('You have successfully left the team')

  } catch (error) {
    // Handle error appropriately
    toast.error('Failed to leave team: ' + error.message)
  }
}
```

## Security and Authorization

### Business Rules

1. **Team Owners Cannot Leave**: Team owners cannot leave their own teams to ensure teams always have an owner
2. **Active Membership Required**: Only active team members can leave teams
3. **Authentication Required**: Users must be authenticated to leave teams
4. **Team Context Required**: Valid team ID must be provided in headers

### Security Considerations

- **Ownership Protection**: Prevents teams from becoming ownerless
- **Session Security**: Requires valid user session
- **Team Validation**: Validates user is actually a member of the team
- **Audit Trail**: Membership removal is logged for security monitoring

## Error Handling Best Practices

```typescript
function handleLeaveTeamError(error: any) {
  const errorMessage = error?.payload?.message || error?.payload?.errors?.[0]?.message || error.message

  switch (true) {
    case errorMessage.includes('Team owners cannot leave'):
      return {
        title: 'Cannot Leave Team',
        message: 'As the team owner, you cannot leave this team. Transfer ownership to another member first.',
        action: 'Transfer Ownership'
      }

    case errorMessage.includes('not a member'):
      return {
        title: 'Not a Team Member',
        message: 'You are not a member of this team.',
        action: 'Refresh Page'
      }

    case errorMessage.includes('Unauthorized'):
      return {
        title: 'Authentication Required',
        message: 'Please log in to continue.',
        action: 'Log In'
      }

    case errorMessage.includes('Invalid team selector'):
      return {
        title: 'Invalid Team',
        message: 'The team you are trying to leave could not be found.',
        action: 'Refresh Page'
      }

    default:
      return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Try Again'
      }
  }
}

// Usage in component
function LeaveTeamWithErrorHandling({ teamId }: { teamId: string }) {
  const handleError = (error: any) => {
    const errorInfo = handleLeaveTeamError(error)

    // Show user-friendly error dialog
    showErrorDialog({
      title: errorInfo.title,
      message: errorInfo.message,
      primaryAction: errorInfo.action
    })
  }

  // Component implementation...
}
```

## Testing the Endpoint

### Manual Testing

```bash
# Test successful leave (as team member)
curl -X DELETE http://localhost:3000/memberships/leave \
  -H "Content-Type: application/json" \
  -H "X-Team-Id: team-id-here" \
  -H "Cookie: session=your-session-cookie"

# Test owner cannot leave (as team owner)
curl -X DELETE http://localhost:3000/memberships/leave \
  -H "Content-Type: application/json" \
  -H "X-Team-Id: owned-team-id" \
  -H "Cookie: owner-session-cookie"

# Test non-member cannot leave
curl -X DELETE http://localhost:3000/memberships/leave \
  -H "Content-Type: application/json" \
  -H "X-Team-Id: other-team-id" \
  -H "Cookie: session-cookie"
```

## Related Endpoints

- `POST /memberships` - Invite new team members
- `PUT /memberships/:token` - Accept team invitation
- `DELETE /memberships/:token` - Reject team invitation
- `DELETE /memberships/:membershipId/access` - Revoke team member access (admin action)
- `GET /teams` - List user's teams
- `GET /teams/:teamId/switch` - Switch active team session

## Migration and Cleanup

When implementing this endpoint, consider:

1. **Data Cleanup**: Ensure proper cleanup of team-specific user data
2. **Notification**: Consider notifying other team members when someone leaves
3. **Analytics**: Track team departure patterns for insights
4. **Backup**: Maintain audit logs of membership changes