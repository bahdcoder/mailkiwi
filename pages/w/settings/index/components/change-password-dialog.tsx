import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { navigate } from '#root/pages/utils/navigate.js'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'
import { PasswordField } from '#root/pages/components/input/password-field.js'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { handleError, handleSuccess } from '#root/pages/utils/toast-helpers'

export interface ChangePasswordDialogProps extends React.PropsWithChildren {}

export function ChangePasswordDialog({ children }: ChangePasswordDialogProps) {
  const [isDialogReallyOpen, setIsDialogReallyOpen] = useState(false)
  const { isPending, serverFormProps, error } = useServerFormMutation({
    method: 'POST',
    action: '/auth/passwords/change',
    onError(error, variables, context) {
      handleError(error)
    },
    onSuccess() {
      handleSuccess('Your password has been updated successfully')
      setIsDialogReallyOpen(false)
    },
  })

  return (
    <Dialog.Root open={isDialogReallyOpen} onOpenChange={setIsDialogReallyOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <ServerForm {...serverFormProps}>
          <Dialog.Header>
            <Dialog.Title>Change password</Dialog.Title>
            <Dialog.Description>Create a new password</Dialog.Description>

            <div className="py-3 grid grid-cols-1 gap-4 ">
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
            </div>
            <div className="grid grid-cols-1 gap-3 overflow-hidden relative">
              <PasswordField
                placeholder="New password"
                strengthIndicator
                name="newPassword"
                required
              >
                <TextField.Label htmlFor="newPassword">New password</TextField.Label>
                {error?.errorsMap?.newPassword ? (
                  <TextField.Error className="mt-8">
                    {error.errorsMap.newPassword}
                  </TextField.Error>
                ) : null}
              </PasswordField>
            </div>
            <div className="py-3 grid grid-cols-1 gap-4 ">
              <PasswordField
                name="confirmNewPassword"
                placeholder="Confirm your new password"
                required
              >
                <TextField.Label htmlFor="confirmNewPassword">
                  Confirm New Password
                </TextField.Label>
                {error?.errorsMap?.confirmNewPassword ? (
                  <TextField.Error>{error.errorsMap.confirmNewPassword}</TextField.Error>
                ) : null}
              </PasswordField>
            </div>
          </Dialog.Header>
          <Dialog.Footer className="flex justify-center gap-10 py-8">
            <Dialog.Close asChild disabled={isPending}>
              <Button variant="tertiary" className="flex-1">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" loading={isPending} className="flex-1">
              {isPending ? 'Updating Password...' : 'Update Password'}
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
