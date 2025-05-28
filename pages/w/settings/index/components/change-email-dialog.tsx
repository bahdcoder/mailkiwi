import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as TextField from '@kibamail/owly/text-field'
import * as CodeInput from '@kibamail/owly/code-input'
import type React from 'react'
import type { UserWithTeams } from '#root/database/database_schema_types.js'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  handleEmailChangeError,
  handleError,
  handleSuccess,
} from '#root/pages/utils/toast-helpers'

interface ChangeEmailDialogProps extends React.PropsWithChildren {
  user?: UserWithTeams
}

export function ChangeEmailDialog({ user, children }: ChangeEmailDialogProps) {
  const [showEmailForm, setShowEmailForm] = useState(true)

  const { isPending, serverFormProps, error, isSuccess } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/initiate',
    onError(error, variables, context) {
      handleEmailChangeError(error)
    },
    onSuccess() {
      setShowEmailForm(false)
      handleSuccess(`Verification code has been sent to ${user?.email}`)
    },
  })

  const { isPending: isCancelling, serverFormProps: cancelFormProps } =
    useServerFormMutation({
      method: 'DELETE',
      action: '/auth/email/change/cancel',
      onError(error, variables, context) {
        console.log(error, ':::::::::::; error :::::::::')
        handleError(error)
      },
      onSuccess() {
        // Refresh user data
        handleSuccess('Reset email canceled')
      },
    })

  const {
    isPending: confirming,
    serverFormProps: confirmForm,
    error: errorConfirm,
    isSuccess: emailConfirmed,
  } = useServerFormMutation({
    method: 'POST',
    action: '/auth/email/change/confirm',
    onSuccess(data, variables, context) {
      handleSuccess(data)
    },
    onError(error, variables, context) {
      handleError(error)
    },
  })

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      {showEmailForm && !isSuccess ? (
        <Dialog.Content>
          <ServerForm {...serverFormProps}>
            <Dialog.Header>
              <Dialog.Title>Change Email</Dialog.Title>
              <Dialog.Description className="kb-content-tertiary">
                A verification link will be sent to the new email address and the change
                will appear across all workspaces
              </Dialog.Description>
              <div className="py-5 grid grid-cols-1 gap-4 ">
                <TextField.Root placeholder="Adam@example.com" name="email">
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
              <Button type="submit" loading={isPending} className="flex-1">
                Send link
              </Button>
            </Dialog.Footer>
          </ServerForm>
        </Dialog.Content>
      ) : (
        <Dialog.Content>
          <ServerForm {...confirmForm} className="mt-6">
            <Dialog.Header>
              <Dialog.Title>
                Enter the verification code to confirm your email
              </Dialog.Title>
              {!emailConfirmed ? (
                <Dialog.Description className="kb-content-tertiary mb-5">
                  We've sent a verification code to <strong>{user?.email}</strong>. Check
                  your email and enter the code to complete the change.
                </Dialog.Description>
              ) : (
                <Dialog.Description className="kb-content-tertiary mb-5">
                  Email <strong>{user?.email}</strong> has been verified.
                </Dialog.Description>
              )}
              <div className="flex justify-center relative w-full my-5">
                <CodeInput.Input autoFocus name="code" id="code">
                  {errorConfirm?.errorsMap?.code ? (
                    <CodeInput.Error>{errorConfirm?.errorsMap?.code}</CodeInput.Error>
                  ) : null}
                </CodeInput.Input>
              </div>
            </Dialog.Header>
            <Dialog.Footer className="flex justify-center gap-10 py-8">
              <Dialog.Close asChild disabled={confirming} className="flex-1">
                <ServerForm {...cancelFormProps} className="inline flex-1">
                  <Button
                    type="submit"
                    variant="tertiary"
                    size="sm"
                    loading={isCancelling}
                    className="flex-1"
                  >
                    Cancel Email Change
                  </Button>
                </ServerForm>
              </Dialog.Close>
              <Button type="submit" loading={confirming} className="flex-1">
                {confirming ? 'Verifying...' : 'Verify Email'}
              </Button>
            </Dialog.Footer>
          </ServerForm>
        </Dialog.Content>
      )}
    </Dialog.Root>
  )
}
