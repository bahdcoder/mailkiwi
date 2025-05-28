import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'
import { PasswordField } from '#root/pages/components/input/password-field.js'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePageContext } from 'vike-react/usePageContext'
import { handleError, handleSuccess } from '#root/pages/utils/toast-helpers'

export interface LeaveWorkspaceDialogProps extends React.PropsWithChildren {}

export function LeaveWorkspaceDialog({ children }: LeaveWorkspaceDialogProps) {
  const { user, team } = usePageContext()
  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'DELETE',
    action: '/memberships/leave',
    customHeaders: {
      'X-Team-Id': team?.id,
    },
    onSuccess() {
      handleSuccess('You’ve successfully left the workspace')
    },
    onError(error, variables, context) {
      handleError(error)
    },
  })

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <ServerForm {...serverFormProps}>
          <Dialog.Header>
            <Dialog.Title>Leave '{`${team?.name}`}'</Dialog.Title>
            <Dialog.Description className="kb-content-tertiary">
              An invite from the workspace owner will be required to rejoin this
              workspace. Enter your email to continue.
            </Dialog.Description>
            <div className="py-5 grid grid-cols-1 gap-4 ">
              <TextField.Root
                placeholder="Adam@example.com"
                name="email"
                required
                type="email"
              >
                <TextField.Label>Email address</TextField.Label>
                {error?.errorsMap?.email ? (
                  <TextField.Error>{error?.errorsMap?.email}</TextField.Error>
                ) : null}
              </TextField.Root>
            </div>
          </Dialog.Header>
          <Dialog.Footer className="flex justify-center gap-10 py-8">
            <Dialog.Close asChild disabled={isPending}>
              <Button variant="tertiary" className="flex-1">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="submit"
              loading={isPending}
              className="flex-1"
              variant="destructive"
              disabled={user?.id === team?.id}
            >
              Leave workspace
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
