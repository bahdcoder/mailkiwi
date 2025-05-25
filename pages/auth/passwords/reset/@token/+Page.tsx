import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

function ResetPasswordPage() {
  const { routeParams } = usePageContext()

  const { serverFormProps, error, isPending, isSuccess } = useServerFormMutation({
    action: route('auth_passwords_reset', routeParams),
  })

  if (isSuccess) {
    return (
      <div className="w-full max-w-100 mx-auto mt-24">
        <img
          src="/icons/email-send.svg"
          className="mb-4"
          alt="Password reset success icon"
        />
        <Heading>Your password was updated successfully.</Heading>

        <Text className="kb-content-tertiary mt-2">
          You're all set. You may login with your new password now.
        </Text>

        <Button className="mt-10" width={'full'} variant="secondary" asChild>
          <a href={route('auth_login')}>Back to login</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-100 mx-auto mt-24">
      <Heading>Create a new password</Heading>

      <Text className="kb-content-tertiary mt-2">
        Create a new password to regain access to your account
      </Text>

      <ServerForm {...serverFormProps} className="mt-10 flex flex-col">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root
            id="email"
            type="email"
            name="email"
            required
            placeholder="Enter your account email address"
          >
            <TextField.Label htmlFor="email">Email address</TextField.Label>

            {error?.errorsMap?.email ? (
              <TextField.Error> {error?.errorsMap?.email} </TextField.Error>
            ) : null}
          </TextField.Root>

          <div className="relative">
            <PasswordField
              strengthIndicator
              id="new-password"
              name="password"
              required
              placeholder="Choose a new password"
            >
              <TextField.Label htmlFor="new-password">New password</TextField.Label>

              {error?.errorsMap?.password ? (
                <TextField.Error className="mt-6">
                  {' '}
                  {error?.errorsMap?.password}{' '}
                </TextField.Error>
              ) : null}
            </PasswordField>
          </div>

          <PasswordField
            placeholder="Confirm your password"
            id="confirm-password"
            name="passwordConfirm"
            required
          >
            <TextField.Label htmlFor="confirm-password">Confirm password</TextField.Label>
            {error?.errorsMap?.passwordConfirm ? (
              <TextField.Error> {error?.errorsMap?.passwordConfirm} </TextField.Error>
            ) : null}
          </PasswordField>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full mt-6">
          <Button loading={isPending} type="submit" width={'full'}>
            Continue
          </Button>
        </div>
      </ServerForm>
    </div>
  )
}

export { ResetPasswordPage as Page }
